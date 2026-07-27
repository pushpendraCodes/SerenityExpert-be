import Follow from "../models/Follow.js";
import User from "../models/User.js";
import Expert from "../models/Expert.js";
import { createNotification } from "./notification.service.js";
import { NotificationType, ExpertStatus } from "../types/index.js";
import { NotFoundError, ConflictError, ValidationError } from "../utils/AppError.js";
import { paginate } from "../utils/pagination.js";
import type { PaginationQuery } from "../types/index.js";

export async function followUser(followerId: string, followingId: string) {
  if (followerId === followingId) {
    throw new ValidationError("Cannot follow yourself");
  }

  const target = await User.findById(followingId);
  if (!target || target.isBlocked) throw new NotFoundError("User");

  const existing = await Follow.findOne({ followerId, followingId });
  if (existing) throw new ConflictError("Already following");

  const follow = await Follow.create({ followerId, followingId });

  const follower = await User.findById(followerId).select("name");
  await createNotification(
    followingId,
    "New follower",
    `${follower?.name || "Someone"} started following you`,
    NotificationType.FOLLOW,
    { followerId }
  ).catch(() => undefined);

  return follow;
}

export async function unfollowUser(followerId: string, followingId: string) {
  const result = await Follow.findOneAndDelete({ followerId, followingId });
  if (!result) throw new NotFoundError("Follow");
}

export async function getFollowers(userId: string, query: PaginationQuery) {
  return paginate({
    model: Follow,
    filter: { followingId: userId },
    query,
    sort: { createdAt: -1 },
    populate: { path: "followerId", select: "name avatar city state country" },
  });
}

export async function getFollowing(userId: string, query: PaginationQuery) {
  return paginate({
    model: Follow,
    filter: { followerId: userId },
    query,
    sort: { createdAt: -1 },
    populate: { path: "followingId", select: "name avatar city state country" },
  });
}

/**
 * People the user follows, enriched with live status for the chat rail:
 * - isCallable: they have an approved call profile (never surfaced as "staff")
 * - isOnline: callable + currently online/available
 * - expertId / pricePerMinute: used to place a call
 * Ordered so online-callable people float to the top.
 */
export async function getFollowingWithStatus(userId: string) {
  const follows = await Follow.find({ followerId: userId })
    .sort({ createdAt: -1 })
    .populate({ path: "followingId", select: "name avatar city state country" });

  type PopulatedUser = { _id: { toString(): string }; name?: string; avatar?: string };
  const targets = follows
    .map((f) => f.followingId as unknown as PopulatedUser | null)
    .filter((u): u is PopulatedUser => Boolean(u && u._id));

  const targetIds = targets.map((u) => u._id.toString());

  const experts = await Expert.find({
    userId: { $in: targetIds },
    isApproved: true,
  }).select("userId status pricePerMinute");

  const expertByUser = new Map(
    experts.map((e) => [e.userId.toString(), e])
  );

  const list = targets.map((u) => {
    const expert = expertByUser.get(String(u._id));
    const isOnline = expert?.status === ExpertStatus.ONLINE;
    return {
      _id: String(u._id),
      name: u.name,
      avatar: u.avatar,
      isCallable: Boolean(expert),
      isOnline,
      expertId: expert ? expert._id.toString() : null,
      pricePerMinute: expert ? expert.pricePerMinute : null,
    };
  });

  list.sort((a, b) => {
    const score = (x: typeof a) => (x.isOnline ? 2 : x.isCallable ? 1 : 0);
    return score(b) - score(a);
  });

  return list;
}

export async function getFollowCounts(userId: string) {
  const [followersCount, followingCount] = await Promise.all([
    Follow.countDocuments({ followingId: userId }),
    Follow.countDocuments({ followerId: userId }),
  ]);
  return { followersCount, followingCount };
}
