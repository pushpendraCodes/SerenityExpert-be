"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisAddLike = redisAddLike;
exports.redisRemoveLike = redisRemoveLike;
exports.redisGetLikesCount = redisGetLikesCount;
exports.redisSeedLikesCount = redisSeedLikesCount;
exports.getLikedPostIdSet = getLikedPostIdSet;
exports.enqueueNotification = enqueueNotification;
exports.processNotificationQueue = processNotificationQueue;
exports.migrateLegacyJournalLikes = migrateLegacyJournalLikes;
exports.deleteLikesForPost = deleteLikesForPost;
const redis_js_1 = require("../config/redis.js");
const cache_service_js_1 = require("./cache.service.js");
const JournalLike_js_1 = __importDefault(require("../models/JournalLike.js"));
const JournalPost_js_1 = __importDefault(require("../models/JournalPost.js"));
const notification_service_js_1 = require("./notification.service.js");
function safeRedis() {
    try {
        return (0, redis_js_1.getRedisClient)();
    }
    catch {
        return null;
    }
}
async function redisAddLike(postId, userId) {
    const redis = safeRedis();
    if (!redis)
        return;
    try {
        const pipeline = redis.multi();
        pipeline.sAdd(cache_service_js_1.CacheKeys.journalLikedSet(postId), userId);
        pipeline.incr(cache_service_js_1.CacheKeys.journalLikesCount(postId));
        await pipeline.exec();
    }
    catch {
        /* Redis optional */
    }
}
async function redisRemoveLike(postId, userId) {
    const redis = safeRedis();
    if (!redis)
        return;
    try {
        const pipeline = redis.multi();
        pipeline.sRem(cache_service_js_1.CacheKeys.journalLikedSet(postId), userId);
        pipeline.decr(cache_service_js_1.CacheKeys.journalLikesCount(postId));
        await pipeline.exec();
        const raw = await redis.get(cache_service_js_1.CacheKeys.journalLikesCount(postId));
        if (raw != null && Number(raw) < 0) {
            await redis.set(cache_service_js_1.CacheKeys.journalLikesCount(postId), "0");
        }
    }
    catch {
        /* Redis optional */
    }
}
async function redisGetLikesCount(postId) {
    const redis = safeRedis();
    if (!redis)
        return null;
    try {
        const raw = await redis.get(cache_service_js_1.CacheKeys.journalLikesCount(postId));
        if (raw == null)
            return null;
        const n = Number(raw);
        return Number.isFinite(n) ? Math.max(0, n) : null;
    }
    catch {
        return null;
    }
}
async function redisSeedLikesCount(postId, count) {
    const redis = safeRedis();
    if (!redis)
        return;
    try {
        await redis.set(cache_service_js_1.CacheKeys.journalLikesCount(postId), String(Math.max(0, count)));
    }
    catch {
        /* ignore */
    }
}
/** Which of the given posts the viewer has liked (Redis set + Mongo edge fallback). */
async function getLikedPostIdSet(viewerId, postIds) {
    const out = new Set();
    if (!viewerId || postIds.length === 0)
        return out;
    const redis = safeRedis();
    if (redis) {
        try {
            const cold = [];
            for (const postId of postIds) {
                const key = cache_service_js_1.CacheKeys.journalLikedSet(postId);
                const exists = await redis.exists(key);
                if (!exists) {
                    cold.push(postId);
                    continue;
                }
                // Warm set: trust membership (no Mongo round-trip)
                if (await redis.sIsMember(key, viewerId))
                    out.add(postId);
            }
            if (cold.length === 0)
                return out;
            const edges = await JournalLike_js_1.default.find({
                userId: viewerId,
                postId: { $in: cold },
            })
                .select("postId")
                .lean();
            for (const e of edges) {
                const id = String(e.postId);
                out.add(id);
                void redis.sAdd(cache_service_js_1.CacheKeys.journalLikedSet(id), viewerId).catch(() => undefined);
            }
            return out;
        }
        catch {
            /* fall through to Mongo */
        }
    }
    const edges = await JournalLike_js_1.default.find({
        userId: viewerId,
        postId: { $in: postIds },
    })
        .select("postId")
        .lean();
    for (const e of edges)
        out.add(String(e.postId));
    return out;
}
/** Push notification job to Redis list; falls back to fire-and-forget. */
async function enqueueNotification(job) {
    const redis = safeRedis();
    if (redis) {
        try {
            await redis.rPush(cache_service_js_1.CacheKeys.notificationQueue(), JSON.stringify(job));
            return;
        }
        catch {
            /* fall through */
        }
    }
    void (0, notification_service_js_1.createNotification)(job.userId, job.title, job.body, job.type, job.data).catch(() => undefined);
}
/** Drain notification queue (called by cron). */
async function processNotificationQueue(batchSize = 25) {
    const redis = safeRedis();
    if (!redis)
        return 0;
    let processed = 0;
    try {
        for (let i = 0; i < batchSize; i++) {
            const raw = await redis.lPop(cache_service_js_1.CacheKeys.notificationQueue());
            if (!raw)
                break;
            try {
                const job = JSON.parse(raw);
                await (0, notification_service_js_1.createNotification)(job.userId, job.title, job.body, job.type, job.data);
                processed += 1;
            }
            catch (err) {
                console.error("Notification job failed:", err);
            }
        }
    }
    catch (err) {
        console.error("Notification queue drain failed:", err);
    }
    return processed;
}
/**
 * One-time / idempotent migration: copy legacy post.likes[] into JournalLike edges.
 */
async function migrateLegacyJournalLikes(batchSize = 100) {
    let migrated = 0;
    let hasMore = true;
    while (hasMore) {
        const posts = await JournalPost_js_1.default.find({
            likes: { $exists: true, $ne: [] },
        })
            .select("_id likes likesCount")
            .limit(batchSize)
            .lean();
        if (posts.length === 0)
            break;
        for (const post of posts) {
            const likeIds = (post.likes || []);
            if (likeIds.length === 0)
                continue;
            const docs = likeIds.map((userId) => ({
                postId: post._id,
                userId,
            }));
            try {
                await JournalLike_js_1.default.insertMany(docs, { ordered: false });
            }
            catch {
                /* ignore duplicate key errors */
            }
            const edgeCount = await JournalLike_js_1.default.countDocuments({ postId: post._id });
            await JournalPost_js_1.default.updateOne({ _id: post._id }, { $set: { likesCount: edgeCount, likes: [] } });
            await redisSeedLikesCount(String(post._id), edgeCount);
            migrated += 1;
        }
        hasMore = posts.length === batchSize;
    }
    return migrated;
}
async function deleteLikesForPost(postId) {
    await JournalLike_js_1.default.deleteMany({ postId });
    const redis = safeRedis();
    if (!redis)
        return;
    try {
        await redis.del(cache_service_js_1.CacheKeys.journalLikedSet(postId));
        await redis.del(cache_service_js_1.CacheKeys.journalLikesCount(postId));
    }
    catch {
        /* ignore */
    }
}
//# sourceMappingURL=journalLike.service.js.map