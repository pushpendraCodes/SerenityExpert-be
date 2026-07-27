"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStory = createStory;
exports.getStoryFeed = getStoryFeed;
exports.markStoryViewed = markStoryViewed;
exports.deleteStory = deleteStory;
const mongoose_1 = __importDefault(require("mongoose"));
const Story_js_1 = __importDefault(require("../models/Story.js"));
const User_js_1 = __importDefault(require("../models/User.js"));
const Follow_js_1 = __importDefault(require("../models/Follow.js"));
const cloudinary_service_js_1 = require("./cloudinary.service.js");
const AppError_js_1 = require("../utils/AppError.js");
const STORY_TTL_MS = 24 * 60 * 60 * 1000;
async function createStory(authorId, data) {
    const user = await User_js_1.default.findById(authorId);
    if (!user)
        throw new AppError_js_1.NotFoundError("User");
    if (!data.mediaUrl || !data.publicId) {
        throw new AppError_js_1.ValidationError("Media is required");
    }
    const thumbnailUrl = data.thumbnailUrl ||
        (data.mediaType === "video" ? (0, cloudinary_service_js_1.reelThumbnailUrl)(data.publicId) : undefined);
    return Story_js_1.default.create({
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
async function getStoryFeed(viewerId) {
    const following = await Follow_js_1.default.find({ followerId: viewerId }).select("followingId");
    const followingIds = following.map((f) => f.followingId);
    const authorFilter = {
        $in: [...followingIds, new mongoose_1.default.Types.ObjectId(viewerId)],
    };
    const stories = await Story_js_1.default.find({
        authorId: authorFilter,
        expiresAt: { $gt: new Date() },
    }).sort({ createdAt: 1 });
    const byAuthor = new Map();
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
        if (!viewedByMe && aid !== viewerId)
            group.hasUnviewed = true;
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
        if (a.isOwn && !b.isOwn)
            return -1;
        if (!a.isOwn && b.isOwn)
            return 1;
        if (a.hasUnviewed && !b.hasUnviewed)
            return -1;
        if (!a.hasUnviewed && b.hasUnviewed)
            return 1;
        return 0;
    });
    return list;
}
async function markStoryViewed(storyId, viewerId) {
    const story = await Story_js_1.default.findOne({
        _id: storyId,
        expiresAt: { $gt: new Date() },
    });
    if (!story)
        throw new AppError_js_1.NotFoundError("Story");
    if (story.authorId.toString() === viewerId)
        return story;
    const oid = new mongoose_1.default.Types.ObjectId(viewerId);
    if (!story.viewers.some((v) => v.equals(oid))) {
        story.viewers.push(oid);
        await story.save();
    }
    return story;
}
async function deleteStory(storyId, authorId) {
    const story = await Story_js_1.default.findById(storyId);
    if (!story)
        throw new AppError_js_1.NotFoundError("Story");
    if (story.authorId.toString() !== authorId)
        throw new AppError_js_1.ForbiddenError("Not your story");
    await Story_js_1.default.deleteOne({ _id: storyId });
    await (0, cloudinary_service_js_1.deleteAsset)(story.publicId, story.mediaType).catch(() => undefined);
}
//# sourceMappingURL=story.service.js.map