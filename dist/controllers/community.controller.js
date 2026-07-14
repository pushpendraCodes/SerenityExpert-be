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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportContent = exports.toggleCommentLike = exports.replyComment = exports.addComment = exports.toggleLike = exports.deleteQuestion = exports.updateQuestion = exports.getQuestion = exports.listMyQuestions = exports.listQuestions = exports.createQuestion = void 0;
const CommunityComment_js_1 = __importDefault(require("../models/CommunityComment.js"));
const communityService = __importStar(require("../services/community.service.js"));
const response_js_1 = require("../utils/response.js");
const asyncHandler_js_1 = require("../utils/asyncHandler.js");
const params_js_1 = require("../utils/params.js");
const AppError_js_1 = require("../utils/AppError.js");
exports.createQuestion = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const question = await communityService.createQuestion(req.user._id.toString(), req.body);
    return (0, response_js_1.sendCreated)(res, question, "Question posted");
});
exports.listQuestions = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const result = await communityService.listQuestions(req.query);
    return (0, response_js_1.sendPaginated)(res, result);
});
exports.listMyQuestions = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const result = await communityService.listMyQuestions(req.user._id.toString(), req.query);
    return (0, response_js_1.sendPaginated)(res, result);
});
exports.getQuestion = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const data = await communityService.getQuestionById((0, params_js_1.getParam)(req, "id"));
    return (0, response_js_1.sendSuccess)(res, data);
});
exports.updateQuestion = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const question = await communityService.updateQuestion((0, params_js_1.getParam)(req, "id"), req.user._id.toString(), req.body);
    return (0, response_js_1.sendSuccess)(res, question, "Question updated");
});
exports.deleteQuestion = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    await communityService.deleteQuestion((0, params_js_1.getParam)(req, "id"), req.user._id.toString());
    return (0, response_js_1.sendSuccess)(res, null, "Question deleted");
});
exports.toggleLike = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const result = await communityService.toggleQuestionLike((0, params_js_1.getParam)(req, "id"), req.user._id.toString());
    return (0, response_js_1.sendSuccess)(res, result);
});
exports.addComment = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const comment = await communityService.addComment((0, params_js_1.getParam)(req, "id"), req.user._id.toString(), req.body.body);
    return (0, response_js_1.sendCreated)(res, comment, "Comment added");
});
exports.replyComment = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const parentComment = await CommunityComment_js_1.default.findById((0, params_js_1.getParam)(req, "id"));
    if (!parentComment)
        throw new AppError_js_1.NotFoundError("Comment");
    const comment = await communityService.addComment(parentComment.questionId.toString(), req.user._id.toString(), req.body.body, (0, params_js_1.getParam)(req, "id"));
    return (0, response_js_1.sendCreated)(res, comment, "Reply added");
});
exports.toggleCommentLike = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const result = await communityService.toggleCommentLike((0, params_js_1.getParam)(req, "id"), req.user._id.toString());
    return (0, response_js_1.sendSuccess)(res, result);
});
exports.reportContent = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const report = await communityService.reportContent(req.user._id.toString(), req.body.targetType, req.body.targetId, req.body.reason, req.body.description);
    return (0, response_js_1.sendCreated)(res, report, "Report submitted");
});
//# sourceMappingURL=community.controller.js.map