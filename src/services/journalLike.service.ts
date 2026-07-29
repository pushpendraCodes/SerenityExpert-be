import { getRedisClient } from "../config/redis.js";
import { CacheKeys } from "./cache.service.js";
import JournalLike from "../models/JournalLike.js";
import JournalPost from "../models/JournalPost.js";
import { createNotification } from "./notification.service.js";
import { NotificationType } from "../types/index.js";
import mongoose from "mongoose";

function safeRedis() {
  try {
    return getRedisClient();
  } catch {
    return null;
  }
}

export async function redisAddLike(postId: string, userId: string): Promise<void> {
  const redis = safeRedis();
  if (!redis) return;
  try {
    const pipeline = redis.multi();
    pipeline.sAdd(CacheKeys.journalLikedSet(postId), userId);
    pipeline.incr(CacheKeys.journalLikesCount(postId));
    await pipeline.exec();
  } catch {
    /* Redis optional */
  }
}

export async function redisRemoveLike(postId: string, userId: string): Promise<void> {
  const redis = safeRedis();
  if (!redis) return;
  try {
    const pipeline = redis.multi();
    pipeline.sRem(CacheKeys.journalLikedSet(postId), userId);
    pipeline.decr(CacheKeys.journalLikesCount(postId));
    await pipeline.exec();
    const raw = await redis.get(CacheKeys.journalLikesCount(postId));
    if (raw != null && Number(raw) < 0) {
      await redis.set(CacheKeys.journalLikesCount(postId), "0");
    }
  } catch {
    /* Redis optional */
  }
}

export async function redisGetLikesCount(postId: string): Promise<number | null> {
  const redis = safeRedis();
  if (!redis) return null;
  try {
    const raw = await redis.get(CacheKeys.journalLikesCount(postId));
    if (raw == null) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? Math.max(0, n) : null;
  } catch {
    return null;
  }
}

export async function redisSeedLikesCount(postId: string, count: number): Promise<void> {
  const redis = safeRedis();
  if (!redis) return;
  try {
    await redis.set(CacheKeys.journalLikesCount(postId), String(Math.max(0, count)));
  } catch {
    /* ignore */
  }
}

/** Which of the given posts the viewer has liked (Redis set + Mongo edge fallback). */
export async function getLikedPostIdSet(
  viewerId: string,
  postIds: string[]
): Promise<Set<string>> {
  const out = new Set<string>();
  if (!viewerId || postIds.length === 0) return out;

  const redis = safeRedis();
  if (redis) {
    try {
      const cold: string[] = [];
      for (const postId of postIds) {
        const key = CacheKeys.journalLikedSet(postId);
        const exists = await redis.exists(key);
        if (!exists) {
          cold.push(postId);
          continue;
        }
        // Warm set: trust membership (no Mongo round-trip)
        if (await redis.sIsMember(key, viewerId)) out.add(postId);
      }
      if (cold.length === 0) return out;

      const edges = await JournalLike.find({
        userId: viewerId,
        postId: { $in: cold },
      })
        .select("postId")
        .lean();
      for (const e of edges) {
        const id = String(e.postId);
        out.add(id);
        void redis.sAdd(CacheKeys.journalLikedSet(id), viewerId).catch(() => undefined);
      }
      return out;
    } catch {
      /* fall through to Mongo */
    }
  }

  const edges = await JournalLike.find({
    userId: viewerId,
    postId: { $in: postIds },
  })
    .select("postId")
    .lean();
  for (const e of edges) out.add(String(e.postId));
  return out;
}

export type NotificationJob = {
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  data?: Record<string, unknown>;
};

/** Push notification job to Redis list; falls back to fire-and-forget. */
export async function enqueueNotification(job: NotificationJob): Promise<void> {
  const redis = safeRedis();
  if (redis) {
    try {
      await redis.rPush(CacheKeys.notificationQueue(), JSON.stringify(job));
      return;
    } catch {
      /* fall through */
    }
  }
  void createNotification(job.userId, job.title, job.body, job.type, job.data).catch(
    () => undefined
  );
}

/** Drain notification queue (called by cron). */
export async function processNotificationQueue(batchSize = 25): Promise<number> {
  const redis = safeRedis();
  if (!redis) return 0;
  let processed = 0;
  try {
    for (let i = 0; i < batchSize; i++) {
      const raw = await redis.lPop(CacheKeys.notificationQueue());
      if (!raw) break;
      try {
        const job = JSON.parse(raw) as NotificationJob;
        await createNotification(job.userId, job.title, job.body, job.type, job.data);
        processed += 1;
      } catch (err) {
        console.error("Notification job failed:", err);
      }
    }
  } catch (err) {
    console.error("Notification queue drain failed:", err);
  }
  return processed;
}

/**
 * One-time / idempotent migration: copy legacy post.likes[] into JournalLike edges.
 */
export async function migrateLegacyJournalLikes(batchSize = 100): Promise<number> {
  let migrated = 0;
  let hasMore = true;
  while (hasMore) {
    const posts = await JournalPost.find({
      likes: { $exists: true, $ne: [] },
    })
      .select("_id likes likesCount")
      .limit(batchSize)
      .lean();

    if (posts.length === 0) break;

    for (const post of posts) {
      const likeIds = (post.likes || []) as mongoose.Types.ObjectId[];
      if (likeIds.length === 0) continue;

      const docs = likeIds.map((userId) => ({
        postId: post._id,
        userId,
      }));
      try {
        await JournalLike.insertMany(docs, { ordered: false });
      } catch {
        /* ignore duplicate key errors */
      }

      const edgeCount = await JournalLike.countDocuments({ postId: post._id });
      await JournalPost.updateOne(
        { _id: post._id },
        { $set: { likesCount: edgeCount, likes: [] } }
      );
      await redisSeedLikesCount(String(post._id), edgeCount);
      migrated += 1;
    }

    hasMore = posts.length === batchSize;
  }
  return migrated;
}

export async function deleteLikesForPost(postId: string): Promise<void> {
  await JournalLike.deleteMany({ postId });
  const redis = safeRedis();
  if (!redis) return;
  try {
    await redis.del(CacheKeys.journalLikedSet(postId));
    await redis.del(CacheKeys.journalLikesCount(postId));
  } catch {
    /* ignore */
  }
}
