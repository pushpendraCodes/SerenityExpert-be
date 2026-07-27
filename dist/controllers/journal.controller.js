"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicProfile = exports.getComments = exports.addComment = exports.toggleLike = exports.getPost = exports.getUserPosts = exports.getMyPosts = exports.getFeed = exports.deletePost = exports.updatePost = exports.createPost = exports.getUploadSignature = void 0;
const journalService = __importStar(require("../services/journal.service.js"));
const cloudinary_service_js_1 = require("../services/cloudinary.service.js");
const response_js_1 = require("../utils/response.js");
const asyncHandler_js_1 = require("../utils/asyncHandler.js");
const params_js_1 = require("../utils/params.js");
exports.getUploadSignature = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const type = req.query.type || "image";
    const sig = (0, cloudinary_service_js_1.getFeedUploadSignature)(type, req.user._id.toString());
    return (0, response_js_1.sendSuccess)(res, sig);
});
exports.createPost = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const post = await journalService.createPost(req.user._id.toString(), {
        body: req.body.body,
        visibility: req.body.visibility,
        mediaType: req.body.mediaType,
        media: req.body.media,
    });
    return (0, response_js_1.sendCreated)(res, post, "Post created");
});
exports.updatePost = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const post = await journalService.updatePost((0, params_js_1.getParam)(req, "id"), req.user._id.toString(), req.body);
    return (0, response_js_1.sendSuccess)(res, post, "Post updated");
});
exports.deletePost = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    await journalService.deletePost((0, params_js_1.getParam)(req, "id"), req.user._id.toString());
    return (0, response_js_1.sendSuccess)(res, null, "Post deleted");
});
exports.getFeed = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const discoverRaw = req.query.discover;
    const discover = discoverRaw === true || discoverRaw === "true" || discoverRaw === "1";
    const userId = req.user?._id?.toString();
    const result = await journalService.getFeed(userId, {
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        discover: userId ? discover : true,
    });
    return (0, response_js_1.sendPaginated)(res, result);
});
exports.getMyPosts = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const result = await journalService.getMyPosts(req.user._id.toString(), req.query);
    return (0, response_js_1.sendPaginated)(res, result);
});
exports.getUserPosts = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const result = await journalService.getUserPublicPosts((0, params_js_1.getParam)(req, "userId"), req.query);
    return (0, response_js_1.sendPaginated)(res, result);
});
exports.getPost = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const post = await journalService.getPostById((0, params_js_1.getParam)(req, "id"), req.user?._id?.toString());
    return (0, response_js_1.sendSuccess)(res, post);
});
exports.toggleLike = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const post = await journalService.toggleLike((0, params_js_1.getParam)(req, "id"), req.user._id.toString());
    return (0, response_js_1.sendSuccess)(res, post);
});
exports.addComment = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const comment = await journalService.addComment((0, params_js_1.getParam)(req, "id"), req.user._id.toString(), req.body.body, req.body.parentCommentId);
    return (0, response_js_1.sendCreated)(res, comment, "Comment added");
});
exports.getComments = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const result = await journalService.getComments((0, params_js_1.getParam)(req, "id"), req.user?._id?.toString(), req.query);
    return (0, response_js_1.sendPaginated)(res, result);
});
exports.getPublicProfile = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const profile = await journalService.getPublicProfile((0, params_js_1.getParam)(req, "userId"), req.user?._id?.toString());
    return (0, response_js_1.sendSuccess)(res, profile);
});
//# sourceMappingURL=journal.controller.js.map