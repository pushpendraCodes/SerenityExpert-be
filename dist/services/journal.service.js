"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decoratePostsForViewer = decoratePostsForViewer;
exports.createPost = createPost;
exports.updatePost = updatePost;
exports.deletePost = deletePost;
exports.getFeed = getFeed;
exports.getMyPosts = getMyPosts;
exports.getUserPublicPosts = getUserPublicPosts;
exports.getPostById = getPostById;
exports.getPostPublic = getPostPublic;
exports.toggleLike = toggleLike;
exports.addComment = addComment;
exports.getComments = getComments;
exports.getPublicProfile = getPublicProfile;
const JournalPost_js_1 = __importDefault(require("../models/JournalPost.js"));
const JournalComment_js_1 = __importDefault(require("../models/JournalComment.js"));
const JournalLike_js_1 = __importDefault(require("../models/JournalLike.js"));
const User_js_1 = __importDefault(require("../models/User.js"));
const moderation_service_js_1 = require("./moderation.service.js");
const journalLike_service_js_1 = require("./journalLike.service.js");
const cloudinary_service_js_1 = require("./cloudinary.service.js");
const pagination_js_1 = require("../utils/pagination.js");
const index_js_1 = require("../types/index.js");
const AppError_js_1 = require("../utils/AppError.js");
const mongoose_1 = __importDefault(require("mongoose"));
function toPlainPost(post) {
    if (post && typeof post.toJSON === "function") {
        return post.toJSON();
    }
    return { ...post };
}
async function resolveLikesCount(postId, fallback) {
    const cached = await (0, journalLike_service_js_1.redisGetLikesCount)(postId);
    if (cached != null)
        return cached;
    await (0, journalLike_service_js_1.redisSeedLikesCount)(postId, fallback);
    return Math.max(0, fallback);
}
async function decoratePostsForViewer(posts, viewerId) {
    if (posts.length === 0)
        return [];
    const plains = posts.map(toPlainPost);
    const ids = plains.map((p) => String(p._id));
    const likedSet = viewerId ? await (0, journalLike_service_js_1.getLikedPostIdSet)(viewerId, ids) : new Set();
    return Promise.all(plains.map(async (plain) => {
        const id = String(plain._id);
        const likesCount = await resolveLikesCount(id, Number(plain.likesCount) || 0);
        const { likes: _likes, ...rest } = plain;
        return {
            ...rest,
            likesCount,
            likedByMe: likedSet.has(id),
        };
    }));
}
async function decoratePaginated(result, viewerId) {
    const data = await decoratePostsForViewer(result.data, viewerId);
    return { ...result, data };
}
async function createPost(authorId, data) {
    const body = (data.body || "").trim();
    const mediaType = data.mediaType || index_js_1.JournalMediaType.NONE;
    const media = data.media || [];
    if (!body && media.length === 0) {
        throw new AppError_js_1.ValidationError("Post needs text or media");
    }
    if (body)
        await (0, moderation_service_js_1.ensureContentSafe)(body, "Post");
    const user = await User_js_1.default.findById(authorId);
    if (!user)
        throw new AppError_js_1.NotFoundError("User");
    const normalizedMedia = media.map((m) => {
        if (m.resourceType === "video" && !m.thumbnailUrl) {
            return { ...m, thumbnailUrl: (0, cloudinary_service_js_1.reelThumbnailUrl)(m.publicId) };
        }
        return m;
    });
    const post = await JournalPost_js_1.default.create({
        authorId,
        authorName: user.name,
        body,
        visibility: data.visibility,
        mediaType,
        media: normalizedMedia,
        likes: [],
        likesCount: 0,
    });
    await (0, journalLike_service_js_1.redisSeedLikesCount)(post._id.toString(), 0);
    const [decorated] = await decoratePostsForViewer([post], authorId);
    return decorated;
}
async function updatePost(postId, authorId, data) {
    const post = await JournalPost_js_1.default.findOne({ _id: postId, isDeleted: false });
    if (!post)
        throw new AppError_js_1.NotFoundError("Post");
    if (post.authorId.toString() !== authorId)
        throw new AppError_js_1.ForbiddenError("Not your post");
    if (data.body !== undefined) {
        const body = data.body.trim();
        await (0, moderation_service_js_1.ensureContentSafe)(body, "Post");
        post.body = body;
    }
    if (data.visibility !== undefined) {
        post.visibility = data.visibility;
    }
    await post.save();
    const [decorated] = await decoratePostsForViewer([post], authorId);
    return decorated;
}
async function deletePost(postId, authorId) {
    const post = await JournalPost_js_1.default.findOne({ _id: postId, isDeleted: false });
    if (!post)
        throw new AppError_js_1.NotFoundError("Post");
    if (post.authorId.toString() !== authorId)
        throw new AppError_js_1.ForbiddenError("Not your post");
    post.isDeleted = true;
    await post.save();
    await (0, journalLike_service_js_1.deleteLikesForPost)(postId);
    for (const item of post.media || []) {
        await (0, cloudinary_service_js_1.deleteAsset)(item.publicId, item.resourceType).catch(() => undefined);
    }
}
const FEED_SELECT = "-likes -__v";
async function getFeed(userId, query) {
    const filter = {
        isDeleted: false,
        visibility: index_js_1.JournalVisibility.PUBLIC,
    };
    // Feed = posts only; reels live in the Reels section
    const mediaType = typeof query.mediaType === "string" ? query.mediaType : "posts";
    if (mediaType === "reel" || mediaType === index_js_1.JournalMediaType.REEL) {
        filter.mediaType = index_js_1.JournalMediaType.REEL;
    }
    else {
        filter.mediaType = { $ne: index_js_1.JournalMediaType.REEL };
    }
    // Everyone sees all public posts (no following filter; anonymous — no author populate)
    const result = await (0, pagination_js_1.paginate)({
        model: JournalPost_js_1.default,
        filter,
        query,
        select: FEED_SELECT,
        sort: { createdAt: -1 },
    });
    return decoratePaginated(result, userId);
}
/** Author-only: public + private journal. Optional visibility filter. */
async function getMyPosts(authorId, query) {
    const raw = query.visibility;
    const visibility = Array.isArray(raw) ? raw[0] : raw;
    const filter = {
        authorId,
        isDeleted: false,
    };
    if (visibility === index_js_1.JournalVisibility.PUBLIC || visibility === "public") {
        filter.visibility = index_js_1.JournalVisibility.PUBLIC;
    }
    else if (visibility === index_js_1.JournalVisibility.PRIVATE || visibility === "private") {
        filter.visibility = index_js_1.JournalVisibility.PRIVATE;
    }
    const result = await (0, pagination_js_1.paginate)({
        model: JournalPost_js_1.default,
        filter,
        query,
        select: FEED_SELECT,
        sort: { createdAt: -1 },
    });
    return decoratePaginated(result, authorId);
}
/** Public posts only for another user's profile */
async function getUserPublicPosts(_targetUserId, _query, _viewerId) {
    throw new AppError_js_1.ForbiddenError("Public user profiles are disabled");
}
async function getPostById(postId, viewerId) {
    if (!mongoose_1.default.Types.ObjectId.isValid(postId))
        throw new AppError_js_1.NotFoundError("Post");
    const post = await JournalPost_js_1.default.findOne({ _id: postId, isDeleted: false }).select(FEED_SELECT);
    if (!post)
        throw new AppError_js_1.NotFoundError("Post");
    if (post.visibility === index_js_1.JournalVisibility.PRIVATE) {
        if (!viewerId || post.authorId.toString() !== viewerId) {
            throw new AppError_js_1.NotFoundError("Post");
        }
    }
    return post;
}
async function getPostPublic(postId, viewerId) {
    const post = await getPostById(postId, viewerId);
    const [decorated] = await decoratePostsForViewer([post], viewerId);
    return decorated;
}
/**
 * Atomic like toggle via JournalLike edge + $inc likesCount + Redis.
 * Notifications are queued (non-blocking).
 */
async function toggleLike(postId, userId) {
    const post = await getPostById(postId, userId);
    if (post.visibility === index_js_1.JournalVisibility.PRIVATE) {
        throw new AppError_js_1.ForbiddenError("Cannot like private journal posts");
    }
    const postOid = post._id;
    const userOid = new mongoose_1.default.Types.ObjectId(userId);
    const existing = await JournalLike_js_1.default.findOne({ postId: postOid, userId: userOid }).select("_id");
    let likedByMe;
    if (existing) {
        await JournalLike_js_1.default.deleteOne({ _id: existing._id });
        await JournalPost_js_1.default.updateOne({ _id: postOid }, { $inc: { likesCount: -1 }, $pull: { likes: userOid } });
        await JournalPost_js_1.default.updateOne({ _id: postOid, likesCount: { $lt: 0 } }, { $set: { likesCount: 0 } });
        await (0, journalLike_service_js_1.redisRemoveLike)(postId, userId);
        likedByMe = false;
    }
    else {
        try {
            await JournalLike_js_1.default.create({ postId: postOid, userId: userOid });
            await JournalPost_js_1.default.updateOne({ _id: postOid }, { $inc: { likesCount: 1 }, $addToSet: { likes: userOid } });
            await (0, journalLike_service_js_1.redisAddLike)(postId, userId);
            likedByMe = true;
            if (post.authorId.toString() !== userId) {
                void (0, journalLike_service_js_1.enqueueNotification)({
                    userId: post.authorId.toString(),
                    title: "New like",
                    body: "Someone liked your post",
                    type: index_js_1.NotificationType.JOURNAL,
                    data: { postId },
                });
            }
        }
        catch (err) {
            // Unique index race — treat as already liked
            const code = err?.code;
            if (code === 11000) {
                likedByMe = true;
            }
            else {
                throw err;
            }
        }
    }
    const updated = await JournalPost_js_1.default.findById(postOid).select(FEED_SELECT);
    if (!updated)
        throw new AppError_js_1.NotFoundError("Post");
    const likesCount = await resolveLikesCount(postId, updated.likesCount || 0);
    const plain = toPlainPost(updated);
    delete plain.likes;
    return {
        ...plain,
        likesCount,
        likedByMe,
    };
}
async function addComment(postId, authorId, body, parentCommentId) {
    const post = await getPostById(postId, authorId);
    if (post.visibility === index_js_1.JournalVisibility.PRIVATE) {
        throw new AppError_js_1.ForbiddenError("Cannot comment on private journal posts");
    }
    const text = body.trim();
    await (0, moderation_service_js_1.ensureContentSafe)(text, "Comment");
    const user = await User_js_1.default.findById(authorId);
    if (!user)
        throw new AppError_js_1.NotFoundError("User");
    const comment = await JournalComment_js_1.default.create({
        postId,
        authorId,
        authorName: user.name,
        body: text,
        parentCommentId,
    });
    await JournalPost_js_1.default.updateOne({ _id: postId }, { $inc: { commentsCount: 1 } });
    if (post.authorId.toString() !== authorId) {
        void (0, journalLike_service_js_1.enqueueNotification)({
            userId: post.authorId.toString(),
            title: "New comment",
            body: `${user.name} commented on your post`,
            type: index_js_1.NotificationType.JOURNAL,
            data: { postId, commentId: comment._id.toString() },
        });
    }
    return comment;
}
async function getComments(postId, viewerId, query) {
    await getPostById(postId, viewerId);
    return (0, pagination_js_1.paginate)({
        model: JournalComment_js_1.default,
        filter: { postId, isDeleted: false },
        query,
        sort: { createdAt: 1 },
    });
}
async function getPublicProfile(_userId, _viewerId) {
    throw new AppError_js_1.ForbiddenError("Public user profiles are disabled");
}
//# sourceMappingURL=journal.service.js.map