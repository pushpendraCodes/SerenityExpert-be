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
exports.remove = exports.markViewed = exports.getFeed = exports.create = exports.getUploadSignature = void 0;
const storyService = __importStar(require("../services/story.service.js"));
const cloudinary_service_js_1 = require("../services/cloudinary.service.js");
const response_js_1 = require("../utils/response.js");
const asyncHandler_js_1 = require("../utils/asyncHandler.js");
const params_js_1 = require("../utils/params.js");
exports.getUploadSignature = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const type = req.query.type || "image";
    const sig = (0, cloudinary_service_js_1.getStoryUploadSignature)(type, req.user._id.toString());
    return (0, response_js_1.sendSuccess)(res, sig);
});
exports.create = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const story = await storyService.createStory(req.user._id.toString(), req.body);
    return (0, response_js_1.sendCreated)(res, story, "Story created");
});
exports.getFeed = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const groups = await storyService.getStoryFeed(req.user._id.toString());
    return (0, response_js_1.sendSuccess)(res, groups);
});
exports.markViewed = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const story = await storyService.markStoryViewed((0, params_js_1.getParam)(req, "id"), req.user._id.toString());
    return (0, response_js_1.sendSuccess)(res, story);
});
exports.remove = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    await storyService.deleteStory((0, params_js_1.getParam)(req, "id"), req.user._id.toString());
    return (0, response_js_1.sendSuccess)(res, null, "Story deleted");
});
//# sourceMappingURL=story.controller.js.map