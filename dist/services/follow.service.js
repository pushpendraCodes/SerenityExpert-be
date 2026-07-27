"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.followUser = followUser;
exports.unfollowUser = unfollowUser;
exports.getFollowers = getFollowers;
exports.getFollowing = getFollowing;
exports.getFollowingWithStatus = getFollowingWithStatus;
exports.getFollowCounts = getFollowCounts;
const Follow_js_1 = __importDefault(require("../models/Follow.js"));
const User_js_1 = __importDefault(require("../models/User.js"));
const Expert_js_1 = __importDefault(require("../models/Expert.js"));
const notification_service_js_1 = require("./notification.service.js");
const index_js_1 = require("../types/index.js");
const AppError_js_1 = require("../utils/AppError.js");
const pagination_js_1 = require("../utils/pagination.js");
async function followUser(followerId, followingId) {
    if (followerId === followingId) {
        throw new AppError_js_1.ValidationError("Cannot follow yourself");
    }
    const target = await User_js_1.default.findById(followingId);
    if (!target || target.isBlocked)
        throw new AppError_js_1.NotFoundError("User");
    const existing = await Follow_js_1.default.findOne({ followerId, followingId });
    if (existing)
        throw new AppError_js_1.ConflictError("Already following");
    const follow = await Follow_js_1.default.create({ followerId, followingId });
    const follower = await User_js_1.default.findById(followerId).select("name");
    await (0, notification_service_js_1.createNotification)(followingId, "New follower", `${follower?.name || "Someone"} started following you`, index_js_1.NotificationType.FOLLOW, { followerId }).catch(() => undefined);
    return follow;
}
async function unfollowUser(followerId, followingId) {
    const result = await Follow_js_1.default.findOneAndDelete({ followerId, followingId });
    if (!result)
        throw new AppError_js_1.NotFoundError("Follow");
}
async function getFollowers(userId, query) {
    return (0, pagination_js_1.paginate)({
        model: Follow_js_1.default,
        filter: { followingId: userId },
        query,
        sort: { createdAt: -1 },
        populate: { path: "followerId", select: "name avatar city state country" },
    });
}
async function getFollowing(userId, query) {
    return (0, pagination_js_1.paginate)({
        model: Follow_js_1.default,
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
async function getFollowingWithStatus(userId) {
    const follows = await Follow_js_1.default.find({ followerId: userId })
        .sort({ createdAt: -1 })
        .populate({ path: "followingId", select: "name avatar city state country" });
    const targets = follows
        .map((f) => f.followingId)
        .filter((u) => Boolean(u && u._id));
    const targetIds = targets.map((u) => u._id.toString());
    const experts = await Expert_js_1.default.find({
        userId: { $in: targetIds },
        isApproved: true,
    }).select("userId status pricePerMinute");
    const expertByUser = new Map(experts.map((e) => [e.userId.toString(), e]));
    const list = targets.map((u) => {
        const expert = expertByUser.get(String(u._id));
        const isOnline = expert?.status === index_js_1.ExpertStatus.ONLINE;
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
        const score = (x) => (x.isOnline ? 2 : x.isCallable ? 1 : 0);
        return score(b) - score(a);
    });
    return list;
}
async function getFollowCounts(userId) {
    const [followersCount, followingCount] = await Promise.all([
        Follow_js_1.default.countDocuments({ followingId: userId }),
        Follow_js_1.default.countDocuments({ followerId: userId }),
    ]);
    return { followersCount, followingCount };
}
//# sourceMappingURL=follow.service.js.map