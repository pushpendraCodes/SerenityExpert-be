import JournalPost from "../models/JournalPost.js";
import JournalComment from "../models/JournalComment.js";
import JournalLike from "../models/JournalLike.js";
import User from "../models/User.js";
import Follow from "../models/Follow.js";
import { ensureContentSafe } from "./moderation.service.js";
import {
  deleteLikesForPost,
  enqueueNotification,
  getLikedPostIdSet,
  redisAddLike,
  redisGetLikesCount,
  redisRemoveLike,
  redisSeedLikesCount,
} from "./journalLike.service.js";
import { deleteAsset, reelThumbnailUrl } from "./cloudinary.service.js";
import { paginate } from "../utils/pagination.js";
import { JournalVisibility, JournalMediaType, NotificationType } from "../types/index.js";
import { NotFoundError, ForbiddenError, ValidationError } from "../utils/AppError.js";
import type { PaginationQuery, PaginatedResult } from "../types/index.js";
import type { IJournalMediaItem, IJournalPost } from "../models/JournalPost.js";
import type { IJournalComment } from "../models/JournalComment.js";
import mongoose from "mongoose";

/** Public post shape: no likes[] — only likesCount + likedByMe. */
export type JournalPostPublic = Record<string, unknown> & {
  _id: unknown;
  likesCount: number;
  likedByMe: boolean;
};

function toPlainPost(post: IJournalPost | Record<string, unknown>): Record<string, unknown> {
  if (post && typeof (post as IJournalPost).toJSON === "function") {
    return (post as IJournalPost).toJSON() as Record<string, unknown>;
  }
  return { ...(post as Record<string, unknown>) };
}

async function resolveLikesCount(postId: string, fallback: number): Promise<number> {
  const cached = await redisGetLikesCount(postId);
  if (cached != null) return cached;
  await redisSeedLikesCount(postId, fallback);
  return Math.max(0, fallback);
}

export async function decoratePostsForViewer(
  posts: Array<IJournalPost | Record<string, unknown>>,
  viewerId?: string
): Promise<JournalPostPublic[]> {
  if (posts.length === 0) return [];

  const plains = posts.map(toPlainPost);
  const ids = plains.map((p) => String(p._id));
  const likedSet = viewerId ? await getLikedPostIdSet(viewerId, ids) : new Set<string>();

  return Promise.all(
    plains.map(async (plain) => {
      const id = String(plain._id);
      const likesCount = await resolveLikesCount(id, Number(plain.likesCount) || 0);
      const { likes: _likes, ...rest } = plain;
      return {
        ...rest,
        likesCount,
        likedByMe: likedSet.has(id),
      } as JournalPostPublic;
    })
  );
}

async function decoratePaginated(
  result: PaginatedResult<IJournalPost>,
  viewerId?: string
): Promise<PaginatedResult<JournalPostPublic>> {
  const data = await decoratePostsForViewer(result.data as unknown as Record<string, unknown>[], viewerId);
  return { ...result, data };
}

export async function createPost(
  authorId: string,
  data: {
    body?: string;
    visibility: JournalVisibility;
    mediaType?: JournalMediaType;
    media?: IJournalMediaItem[];
  }
): Promise<JournalPostPublic> {
  const body = (data.body || "").trim();
  const mediaType = data.mediaType || JournalMediaType.NONE;
  const media = data.media || [];

  if (!body && media.length === 0) {
    throw new ValidationError("Post needs text or media");
  }
  if (body) await ensureContentSafe(body, "Post");

  const user = await User.findById(authorId);
  if (!user) throw new NotFoundError("User");

  const normalizedMedia = media.map((m) => {
    if (m.resourceType === "video" && !m.thumbnailUrl) {
      return { ...m, thumbnailUrl: reelThumbnailUrl(m.publicId) };
    }
    return m;
  });

  const post = await JournalPost.create({
    authorId,
    authorName: user.name,
    body,
    visibility: data.visibility,
    mediaType,
    media: normalizedMedia,
    likes: [],
    likesCount: 0,
  });
  await redisSeedLikesCount(post._id.toString(), 0);
  const [decorated] = await decoratePostsForViewer([post], authorId);
  return decorated;
}

export async function updatePost(
  postId: string,
  authorId: string,
  data: { body?: string; visibility?: JournalVisibility }
): Promise<JournalPostPublic> {
  const post = await JournalPost.findOne({ _id: postId, isDeleted: false });
  if (!post) throw new NotFoundError("Post");
  if (post.authorId.toString() !== authorId) throw new ForbiddenError("Not your post");

  if (data.body !== undefined) {
    const body = data.body.trim();
    await ensureContentSafe(body, "Post");
    post.body = body;
  }
  if (data.visibility !== undefined) {
    post.visibility = data.visibility;
  }
  await post.save();
  const [decorated] = await decoratePostsForViewer([post], authorId);
  return decorated;
}

export async function deletePost(postId: string, authorId: string): Promise<void> {
  const post = await JournalPost.findOne({ _id: postId, isDeleted: false });
  if (!post) throw new NotFoundError("Post");
  if (post.authorId.toString() !== authorId) throw new ForbiddenError("Not your post");
  post.isDeleted = true;
  await post.save();

  await deleteLikesForPost(postId);

  for (const item of post.media || []) {
    await deleteAsset(item.publicId, item.resourceType).catch(() => undefined);
  }
}

const FEED_SELECT = "-likes -__v";

export async function getFeed(
  userId: string | undefined,
  query: PaginationQuery & { discover?: boolean; mediaType?: string }
) {
  const discover = userId ? query.discover !== false : true;

  const filter: Record<string, unknown> = {
    isDeleted: false,
    visibility: JournalVisibility.PUBLIC,
  };

  // Feed = posts only; reels live in the Reels section
  const mediaType = typeof query.mediaType === "string" ? query.mediaType : "posts";
  if (mediaType === "reel" || mediaType === JournalMediaType.REEL) {
    filter.mediaType = JournalMediaType.REEL;
  } else {
    filter.mediaType = { $ne: JournalMediaType.REEL };
  }

  if (!discover && userId) {
    const following = await Follow.find({ followerId: userId }).select("followingId");
    const followingIds = following.map((f) => f.followingId);
    filter.authorId = { $in: [...followingIds, new mongoose.Types.ObjectId(userId)] };
  }

  const result = await paginate({
    model: JournalPost,
    filter,
    query,
    select: FEED_SELECT,
    sort: { createdAt: -1 },
    populate: { path: "authorId", select: "name avatar city state country" },
  });
  return decoratePaginated(result, userId);
}

/** Author-only: public + private journal. Optional visibility filter. */
export async function getMyPosts(
  authorId: string,
  query: PaginationQuery & { visibility?: string | string[] }
) {
  const raw = query.visibility;
  const visibility = Array.isArray(raw) ? raw[0] : raw;
  const filter: Record<string, unknown> = {
    authorId,
    isDeleted: false,
  };
  if (visibility === JournalVisibility.PUBLIC || visibility === "public") {
    filter.visibility = JournalVisibility.PUBLIC;
  } else if (visibility === JournalVisibility.PRIVATE || visibility === "private") {
    filter.visibility = JournalVisibility.PRIVATE;
  }

  const result = await paginate({
    model: JournalPost,
    filter,
    query,
    select: FEED_SELECT,
    sort: { createdAt: -1 },
  });
  return decoratePaginated(result, authorId);
}

/** Public posts only for another user's profile */
export async function getUserPublicPosts(
  targetUserId: string,
  query: PaginationQuery,
  viewerId?: string
) {
  const result = await paginate({
    model: JournalPost,
    filter: {
      authorId: targetUserId,
      isDeleted: false,
      visibility: JournalVisibility.PUBLIC,
    },
    query,
    select: FEED_SELECT,
    sort: { createdAt: -1 },
  });
  return decoratePaginated(result, viewerId);
}

export async function getPostById(postId: string, viewerId?: string): Promise<IJournalPost> {
  if (!mongoose.Types.ObjectId.isValid(postId)) throw new NotFoundError("Post");

  const post = await JournalPost.findOne({ _id: postId, isDeleted: false }).select(FEED_SELECT);
  if (!post) throw new NotFoundError("Post");

  if (post.visibility === JournalVisibility.PRIVATE) {
    if (!viewerId || post.authorId.toString() !== viewerId) {
      throw new NotFoundError("Post");
    }
  }

  return post;
}

export async function getPostPublic(postId: string, viewerId?: string): Promise<JournalPostPublic> {
  const post = await getPostById(postId, viewerId);
  const [decorated] = await decoratePostsForViewer([post], viewerId);
  return decorated;
}

/**
 * Atomic like toggle via JournalLike edge + $inc likesCount + Redis.
 * Notifications are queued (non-blocking).
 */
export async function toggleLike(postId: string, userId: string): Promise<JournalPostPublic> {
  const post = await getPostById(postId, userId);
  if (post.visibility === JournalVisibility.PRIVATE) {
    throw new ForbiddenError("Cannot like private journal posts");
  }

  const postOid = post._id;
  const userOid = new mongoose.Types.ObjectId(userId);
  const existing = await JournalLike.findOne({ postId: postOid, userId: userOid }).select("_id");

  let likedByMe: boolean;

  if (existing) {
    await JournalLike.deleteOne({ _id: existing._id });
    await JournalPost.updateOne(
      { _id: postOid },
      { $inc: { likesCount: -1 }, $pull: { likes: userOid } }
    );
    await JournalPost.updateOne({ _id: postOid, likesCount: { $lt: 0 } }, { $set: { likesCount: 0 } });
    await redisRemoveLike(postId, userId);
    likedByMe = false;
  } else {
    try {
      await JournalLike.create({ postId: postOid, userId: userOid });
      await JournalPost.updateOne(
        { _id: postOid },
        { $inc: { likesCount: 1 }, $addToSet: { likes: userOid } }
      );
      await redisAddLike(postId, userId);
      likedByMe = true;

      if (post.authorId.toString() !== userId) {
        void enqueueNotification({
          userId: post.authorId.toString(),
          title: "New like",
          body: "Someone liked your post",
          type: NotificationType.JOURNAL,
          data: { postId },
        });
      }
    } catch (err: unknown) {
      // Unique index race — treat as already liked
      const code = (err as { code?: number })?.code;
      if (code === 11000) {
        likedByMe = true;
      } else {
        throw err;
      }
    }
  }

  const updated = await JournalPost.findById(postOid).select(FEED_SELECT);
  if (!updated) throw new NotFoundError("Post");

  const likesCount = await resolveLikesCount(postId, updated.likesCount || 0);
  const plain = toPlainPost(updated);
  delete plain.likes;
  return {
    ...plain,
    likesCount,
    likedByMe,
  } as JournalPostPublic;
}

export async function addComment(
  postId: string,
  authorId: string,
  body: string,
  parentCommentId?: string
): Promise<IJournalComment> {
  const post = await getPostById(postId, authorId);
  if (post.visibility === JournalVisibility.PRIVATE) {
    throw new ForbiddenError("Cannot comment on private journal posts");
  }

  const text = body.trim();
  await ensureContentSafe(text, "Comment");

  const user = await User.findById(authorId);
  if (!user) throw new NotFoundError("User");

  const comment = await JournalComment.create({
    postId,
    authorId,
    authorName: user.name,
    body: text,
    parentCommentId,
  });

  await JournalPost.updateOne({ _id: postId }, { $inc: { commentsCount: 1 } });

  if (post.authorId.toString() !== authorId) {
    void enqueueNotification({
      userId: post.authorId.toString(),
      title: "New comment",
      body: `${user.name} commented on your post`,
      type: NotificationType.JOURNAL,
      data: { postId, commentId: comment._id.toString() },
    });
  }

  return comment;
}

export async function getComments(postId: string, viewerId: string | undefined, query: PaginationQuery) {
  await getPostById(postId, viewerId);
  return paginate({
    model: JournalComment,
    filter: { postId, isDeleted: false },
    query,
    sort: { createdAt: 1 },
  });
}

export async function getPublicProfile(userId: string, viewerId?: string) {
  const user = await User.findById(userId).select(
    "name avatar city state country gender createdAt profileCompleted"
  );
  if (!user) throw new NotFoundError("User");

  const [followersCount, followingCount, isFollowing] = await Promise.all([
    Follow.countDocuments({ followingId: userId }),
    Follow.countDocuments({ followerId: userId }),
    viewerId
      ? Follow.exists({ followerId: viewerId, followingId: userId }).then(Boolean)
      : Promise.resolve(false),
  ]);

  return {
    ...user.toJSON(),
    followersCount,
    followingCount,
    isFollowing,
  };
}
