import JournalPost from "../models/JournalPost.js";
import JournalComment from "../models/JournalComment.js";
import User from "../models/User.js";
import Follow from "../models/Follow.js";
import { ensureContentSafe } from "./moderation.service.js";
import { createNotification } from "./notification.service.js";
import { deleteAsset, reelThumbnailUrl } from "./cloudinary.service.js";
import { paginate } from "../utils/pagination.js";
import { JournalVisibility, JournalMediaType, NotificationType } from "../types/index.js";
import { NotFoundError, ForbiddenError, ValidationError } from "../utils/AppError.js";
import type { PaginationQuery } from "../types/index.js";
import type { IJournalMediaItem, IJournalPost } from "../models/JournalPost.js";
import type { IJournalComment } from "../models/JournalComment.js";
import mongoose from "mongoose";

export async function createPost(
  authorId: string,
  data: {
    body?: string;
    visibility: JournalVisibility;
    mediaType?: JournalMediaType;
    media?: IJournalMediaItem[];
  }
): Promise<IJournalPost> {
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

  return JournalPost.create({
    authorId,
    authorName: user.name,
    body,
    visibility: data.visibility,
    mediaType,
    media: normalizedMedia,
  });
}

export async function updatePost(
  postId: string,
  authorId: string,
  data: { body?: string; visibility?: JournalVisibility }
): Promise<IJournalPost> {
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
  return post;
}

export async function deletePost(postId: string, authorId: string): Promise<void> {
  const post = await JournalPost.findOne({ _id: postId, isDeleted: false });
  if (!post) throw new NotFoundError("Post");
  if (post.authorId.toString() !== authorId) throw new ForbiddenError("Not your post");
  post.isDeleted = true;
  await post.save();

  for (const item of post.media || []) {
    await deleteAsset(item.publicId, item.resourceType).catch(() => undefined);
  }
}

export async function getFeed(
  userId: string | undefined,
  query: PaginationQuery & { discover?: boolean }
) {
  const discover = userId ? query.discover !== false : true;

  const filter: Record<string, unknown> = {
    isDeleted: false,
    visibility: JournalVisibility.PUBLIC,
  };

  if (!discover && userId) {
    const following = await Follow.find({ followerId: userId }).select("followingId");
    const followingIds = following.map((f) => f.followingId);
    filter.authorId = { $in: [...followingIds, new mongoose.Types.ObjectId(userId)] };
  }

  return paginate({
    model: JournalPost,
    filter,
    query,
    sort: { createdAt: -1 },
    populate: { path: "authorId", select: "name avatar city state country" },
  });
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

  return paginate({
    model: JournalPost,
    filter,
    query,
    sort: { createdAt: -1 },
  });
}

/** Public posts only for another user's profile */
export async function getUserPublicPosts(targetUserId: string, query: PaginationQuery) {
  return paginate({
    model: JournalPost,
    filter: {
      authorId: targetUserId,
      isDeleted: false,
      visibility: JournalVisibility.PUBLIC,
    },
    query,
    sort: { createdAt: -1 },
  });
}

export async function getPostById(postId: string, viewerId?: string): Promise<IJournalPost> {
  if (!mongoose.Types.ObjectId.isValid(postId)) throw new NotFoundError("Post");

  const post = await JournalPost.findOne({ _id: postId, isDeleted: false });
  if (!post) throw new NotFoundError("Post");

  if (post.visibility === JournalVisibility.PRIVATE) {
    if (!viewerId || post.authorId.toString() !== viewerId) {
      throw new NotFoundError("Post");
    }
  }

  return post;
}

export async function toggleLike(postId: string, userId: string): Promise<IJournalPost> {
  const post = await getPostById(postId, userId);
  if (post.visibility === JournalVisibility.PRIVATE) {
    throw new ForbiddenError("Cannot like private journal posts");
  }

  const uid = new mongoose.Types.ObjectId(userId);
  const liked = post.likes.some((id) => id.equals(uid));
  if (liked) {
    post.likes = post.likes.filter((id) => !id.equals(uid));
    post.likesCount = Math.max(0, post.likesCount - 1);
  } else {
    post.likes.push(uid);
    post.likesCount += 1;
    if (post.authorId.toString() !== userId) {
      await createNotification(
        post.authorId.toString(),
        "New like",
        "Someone liked your post",
        NotificationType.JOURNAL,
        { postId: post._id.toString() }
      ).catch(() => undefined);
    }
  }
  await post.save();
  return post;
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

  post.commentsCount += 1;
  await post.save();

  if (post.authorId.toString() !== authorId) {
    await createNotification(
      post.authorId.toString(),
      "New comment",
      `${user.name} commented on your post`,
      NotificationType.JOURNAL,
      { postId: post._id.toString(), commentId: comment._id.toString() }
    ).catch(() => undefined);
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
