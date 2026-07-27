import mongoose from "mongoose";
import Story from "../models/Story.js";
import User from "../models/User.js";
import Follow from "../models/Follow.js";
import { deleteAsset, reelThumbnailUrl } from "./cloudinary.service.js";
import { NotFoundError, ForbiddenError, ValidationError } from "../utils/AppError.js";

const STORY_TTL_MS = 24 * 60 * 60 * 1000;

export interface StoryGroup {
  authorId: string;
  authorName: string;
  authorAvatar: string;
  hasUnviewed: boolean;
  isOwn: boolean;
  stories: Array<{
    _id: string;
    mediaUrl: string;
    mediaType: "image" | "video";
    thumbnailUrl?: string;
    caption?: string;
    durationSec?: number;
    createdAt: string;
    viewedByMe: boolean;
  }>;
}

export async function createStory(
  authorId: string,
  data: {
    mediaUrl: string;
    publicId: string;
    mediaType: "image" | "video";
    thumbnailUrl?: string;
    caption?: string;
    durationSec?: number;
  }
) {
  const user = await User.findById(authorId);
  if (!user) throw new NotFoundError("User");

  if (!data.mediaUrl || !data.publicId) {
    throw new ValidationError("Media is required");
  }

  const thumbnailUrl =
    data.thumbnailUrl ||
    (data.mediaType === "video" ? reelThumbnailUrl(data.publicId) : undefined);

  return Story.create({
    authorId,
    authorName: user.name,
    authorAvatar: user.avatar || "",
    mediaUrl: data.mediaUrl,
    publicId: data.publicId,
    mediaType: data.mediaType,
    thumbnailUrl,
    caption: (data.caption || "").trim(),
    durationSec: data.durationSec,
    expiresAt: new Date(Date.now() + STORY_TTL_MS),
  });
}

export async function getStoryFeed(viewerId: string): Promise<StoryGroup[]> {
  const following = await Follow.find({ followerId: viewerId }).select("followingId");
  const followingIds = following.map((f) => f.followingId);
  const authorFilter = {
    $in: [...followingIds, new mongoose.Types.ObjectId(viewerId)],
  };

  const stories = await Story.find({
    authorId: authorFilter,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: 1 });

  const byAuthor = new Map<string, StoryGroup>();

  for (const s of stories) {
    const aid = s.authorId.toString();
    const viewedByMe = s.viewers.some((v) => v.toString() === viewerId);
    let group = byAuthor.get(aid);
    if (!group) {
      group = {
        authorId: aid,
        authorName: s.authorName,
        authorAvatar: s.authorAvatar || "",
        hasUnviewed: false,
        isOwn: aid === viewerId,
        stories: [],
      };
      byAuthor.set(aid, group);
    }
    if (!viewedByMe && aid !== viewerId) group.hasUnviewed = true;
    group.stories.push({
      _id: s._id.toString(),
      mediaUrl: s.mediaUrl,
      mediaType: s.mediaType,
      thumbnailUrl: s.thumbnailUrl,
      caption: s.caption,
      durationSec: s.durationSec,
      createdAt: s.createdAt.toISOString(),
      viewedByMe,
    });
  }

  const list = Array.from(byAuthor.values());
  // Own story first, then unviewed, then viewed
  list.sort((a, b) => {
    if (a.isOwn && !b.isOwn) return -1;
    if (!a.isOwn && b.isOwn) return 1;
    if (a.hasUnviewed && !b.hasUnviewed) return -1;
    if (!a.hasUnviewed && b.hasUnviewed) return 1;
    return 0;
  });

  return list;
}

export async function markStoryViewed(storyId: string, viewerId: string) {
  const story = await Story.findOne({
    _id: storyId,
    expiresAt: { $gt: new Date() },
  });
  if (!story) throw new NotFoundError("Story");

  if (story.authorId.toString() === viewerId) return story;

  const oid = new mongoose.Types.ObjectId(viewerId);
  if (!story.viewers.some((v) => v.equals(oid))) {
    story.viewers.push(oid);
    await story.save();
  }
  return story;
}

export async function deleteStory(storyId: string, authorId: string) {
  const story = await Story.findById(storyId);
  if (!story) throw new NotFoundError("Story");
  if (story.authorId.toString() !== authorId) throw new ForbiddenError("Not your story");

  await Story.deleteOne({ _id: storyId });
  await deleteAsset(story.publicId, story.mediaType).catch(() => undefined);
}
