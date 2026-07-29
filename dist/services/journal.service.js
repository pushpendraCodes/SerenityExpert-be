"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPost = createPost;
exports.updatePost = updatePost;
exports.deletePost = deletePost;
exports.getFeed = getFeed;
exports.getMyPosts = getMyPosts;
exports.getUserPublicPosts = getUserPublicPosts;
exports.getPostById = getPostById;
exports.toggleLike = toggleLike;
exports.addComment = addComment;
exports.getComments = getComments;
exports.getPublicProfile = getPublicProfile;
const JournalPost_js_1 = __importDefault(require("../models/JournalPost.js"));
const JournalComment_js_1 = __importDefault(require("../models/JournalComment.js"));
const User_js_1 = __importDefault(require("../models/User.js"));
const Follow_js_1 = __importDefault(require("../models/Follow.js"));
const moderation_service_js_1 = require("./moderation.service.js");
const notification_service_js_1 = require("./notification.service.js");
const cloudinary_service_js_1 = require("./cloudinary.service.js");
const pagination_js_1 = require("../utils/pagination.js");
const index_js_1 = require("../types/index.js");
const AppError_js_1 = require("../utils/AppError.js");
const mongoose_1 = __importDefault(require("mongoose"));
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
    return JournalPost_js_1.default.create({
        authorId,
        authorName: user.name,
        body,
        visibility: data.visibility,
        mediaType,
        media: normalizedMedia,
    });
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
    return post;
}
async function deletePost(postId, authorId) {
    const post = await JournalPost_js_1.default.findOne({ _id: postId, isDeleted: false });
    if (!post)
        throw new AppError_js_1.NotFoundError("Post");
    if (post.authorId.toString() !== authorId)
        throw new AppError_js_1.ForbiddenError("Not your post");
    post.isDeleted = true;
    await post.save();
    for (const item of post.media || []) {
        await (0, cloudinary_service_js_1.deleteAsset)(item.publicId, item.resourceType).catch(() => undefined);
    }
}
async function getFeed(userId, query) {
    const discover = userId ? query.discover !== false : true;
    const filter = {
        isDeleted: false,
        visibility: index_js_1.JournalVisibility.PUBLIC,
    };
    if (!discover && userId) {
        const following = await Follow_js_1.default.find({ followerId: userId }).select("followingId");
        const followingIds = following.map((f) => f.followingId);
        filter.authorId = { $in: [...followingIds, new mongoose_1.default.Types.ObjectId(userId)] };
    }
    return (0, pagination_js_1.paginate)({
        model: JournalPost_js_1.default,
        filter,
        query,
        sort: { createdAt: -1 },
        populate: { path: "authorId", select: "name avatar city state country" },
    });
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
    return (0, pagination_js_1.paginate)({
        model: JournalPost_js_1.default,
        filter,
        query,
        sort: { createdAt: -1 },
    });
}
/** Public posts only for another user's profile */
async function getUserPublicPosts(targetUserId, query) {
    return (0, pagination_js_1.paginate)({
        model: JournalPost_js_1.default,
        filter: {
            authorId: targetUserId,
            isDeleted: false,
            visibility: index_js_1.JournalVisibility.PUBLIC,
        },
        query,
        sort: { createdAt: -1 },
    });
}
async function getPostById(postId, viewerId) {
    if (!mongoose_1.default.Types.ObjectId.isValid(postId))
        throw new AppError_js_1.NotFoundError("Post");
    const post = await JournalPost_js_1.default.findOne({ _id: postId, isDeleted: false });
    if (!post)
        throw new AppError_js_1.NotFoundError("Post");
    if (post.visibility === index_js_1.JournalVisibility.PRIVATE) {
        if (!viewerId || post.authorId.toString() !== viewerId) {
            throw new AppError_js_1.NotFoundError("Post");
        }
    }
    return post;
}
async function toggleLike(postId, userId) {
    const post = await getPostById(postId, userId);
    if (post.visibility === index_js_1.JournalVisibility.PRIVATE) {
        throw new AppError_js_1.ForbiddenError("Cannot like private journal posts");
    }
    const uid = new mongoose_1.default.Types.ObjectId(userId);
    const liked = post.likes.some((id) => id.equals(uid));
    if (liked) {
        post.likes = post.likes.filter((id) => !id.equals(uid));
        post.likesCount = Math.max(0, post.likesCount - 1);
    }
    else {
        post.likes.push(uid);
        post.likesCount += 1;
        if (post.authorId.toString() !== userId) {
            await (0, notification_service_js_1.createNotification)(post.authorId.toString(), "New like", "Someone liked your post", index_js_1.NotificationType.JOURNAL, { postId: post._id.toString() }).catch(() => undefined);
        }
    }
    await post.save();
    return post;
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
    post.commentsCount += 1;
    await post.save();
    if (post.authorId.toString() !== authorId) {
        await (0, notification_service_js_1.createNotification)(post.authorId.toString(), "New comment", `${user.name} commented on your post`, index_js_1.NotificationType.JOURNAL, { postId: post._id.toString(), commentId: comment._id.toString() }).catch(() => undefined);
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
async function getPublicProfile(userId, viewerId) {
    const user = await User_js_1.default.findById(userId).select("name avatar city state country gender createdAt profileCompleted");
    if (!user)
        throw new AppError_js_1.NotFoundError("User");
    const [followersCount, followingCount, isFollowing] = await Promise.all([
        Follow_js_1.default.countDocuments({ followingId: userId }),
        Follow_js_1.default.countDocuments({ followerId: userId }),
        viewerId
            ? Follow_js_1.default.exists({ followerId: viewerId, followingId: userId }).then(Boolean)
            : Promise.resolve(false),
    ]);
    return {
        ...user.toJSON(),
        followersCount,
        followingCount,
        isFollowing,
    };
}
//# sourceMappingURL=journal.service.js.map