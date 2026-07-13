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
exports.closeChat = exports.markRead = exports.sendMessage = exports.getMessages = exports.startChat = exports.listChats = void 0;
const Expert_js_1 = __importDefault(require("../models/Expert.js"));
const chatService = __importStar(require("../services/chat.service.js"));
const cloudinary_service_js_1 = require("../services/cloudinary.service.js");
const response_js_1 = require("../utils/response.js");
const asyncHandler_js_1 = require("../utils/asyncHandler.js");
const params_js_1 = require("../utils/params.js");
const index_js_1 = require("../types/index.js");
exports.listChats = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const expert = await Expert_js_1.default.findOne({ userId: req.user._id });
    const result = await chatService.getUserChats(req.user._id.toString(), !!expert, req.query);
    return (0, response_js_1.sendPaginated)(res, result);
});
exports.startChat = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const chat = await chatService.getOrCreateChat(req.user._id.toString(), req.body.expertId);
    return (0, response_js_1.sendCreated)(res, chat, "Chat started");
});
exports.getMessages = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const result = await chatService.getChatMessages((0, params_js_1.getParam)(req, "id"), req.user._id.toString(), req.query);
    return (0, response_js_1.sendPaginated)(res, result);
});
exports.sendMessage = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const expert = await Expert_js_1.default.findOne({ userId: req.user._id });
    const senderRole = expert ? "expert" : "user";
    if (!req.file && !req.body.content?.trim()) {
        return res.status(400).json({ success: false, message: "Message content or image is required" });
    }
    let imageUrl;
    if (req.file) {
        const uploaded = await (0, cloudinary_service_js_1.uploadImage)(req.file.buffer, "chat", (0, params_js_1.getParam)(req, "id"));
        imageUrl = uploaded.url;
    }
    const content = String(req.body.content ?? "").trim();
    const messageType = req.file
        ? index_js_1.MessageType.IMAGE
        : (req.body.messageType || index_js_1.MessageType.TEXT);
    const message = await chatService.sendMessage((0, params_js_1.getParam)(req, "id"), req.user._id.toString(), senderRole, content, messageType, imageUrl);
    return (0, response_js_1.sendCreated)(res, message, "Message sent");
});
exports.markRead = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    await chatService.markChatAsRead((0, params_js_1.getParam)(req, "id"), req.user._id.toString());
    return (0, response_js_1.sendSuccess)(res, null, "Messages marked as read");
});
exports.closeChat = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    await chatService.closeChat((0, params_js_1.getParam)(req, "id"));
    return (0, response_js_1.sendSuccess)(res, null, "Chat closed");
});
//# sourceMappingURL=chat.controller.js.map