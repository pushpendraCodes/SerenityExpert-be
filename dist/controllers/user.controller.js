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
exports.getTransactions = exports.registerFcmToken = exports.markNotificationRead = exports.getNotifications = exports.getHistory = exports.getWallet = exports.uploadAvatar = exports.updateProfile = exports.getMe = void 0;
const User_js_1 = __importDefault(require("../models/User.js"));
const Transaction_js_1 = __importDefault(require("../models/Transaction.js"));
const Call_js_1 = __importDefault(require("../models/Call.js"));
const Recharge_js_1 = __importDefault(require("../models/Recharge.js"));
const Chat_js_1 = __importDefault(require("../models/Chat.js"));
const authService = __importStar(require("../services/auth.service.js"));
const notificationService = __importStar(require("../services/notification.service.js"));
const cloudinary_service_js_1 = require("../services/cloudinary.service.js");
const response_js_1 = require("../utils/response.js");
const asyncHandler_js_1 = require("../utils/asyncHandler.js");
const params_js_1 = require("../utils/params.js");
const pagination_js_1 = require("../utils/pagination.js");
exports.getMe = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const user = await User_js_1.default.findById(req.user._id);
    return (0, response_js_1.sendSuccess)(res, user);
});
exports.updateProfile = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const { name, email } = req.body;
    const user = await User_js_1.default.findByIdAndUpdate(req.user._id, { ...(name && { name }), ...(email && { email }) }, { new: true, runValidators: true });
    return (0, response_js_1.sendSuccess)(res, user, "Profile updated");
});
exports.uploadAvatar = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    if (!req.file) {
        return (0, response_js_1.sendSuccess)(res, null, "No file uploaded");
    }
    const { url } = await (0, cloudinary_service_js_1.uploadImage)(req.file.buffer, "avatars", req.user._id.toString());
    const user = await User_js_1.default.findByIdAndUpdate(req.user._id, { avatar: url }, { new: true });
    return (0, response_js_1.sendSuccess)(res, user, "Avatar updated");
});
exports.getWallet = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const user = await User_js_1.default.findById(req.user._id).select("walletBalance");
    const transactions = await Transaction_js_1.default.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .limit(10);
    return (0, response_js_1.sendSuccess)(res, { balance: user?.walletBalance ?? 0, recentTransactions: transactions });
});
exports.getHistory = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const userId = req.user._id;
    const [calls, chats, recharges] = await Promise.all([
        Call_js_1.default.find({ userId }).sort({ createdAt: -1 }).limit(20).populate({ path: "expertId", populate: { path: "userId", select: "name avatar" } }),
        Chat_js_1.default.find({ userId }).sort({ updatedAt: -1 }).limit(20).populate({ path: "expertId", populate: { path: "userId", select: "name avatar" } }),
        Recharge_js_1.default.find({ userId }).sort({ createdAt: -1 }).limit(20),
    ]);
    return (0, response_js_1.sendSuccess)(res, { calls, chats, recharges });
});
exports.getNotifications = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const result = await notificationService.getUserNotifications(req.user._id.toString(), req.query);
    return (0, response_js_1.sendPaginated)(res, result);
});
exports.markNotificationRead = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    await notificationService.markNotificationRead(req.user._id.toString(), (0, params_js_1.getParam)(req, "id"));
    return (0, response_js_1.sendSuccess)(res, null, "Notification marked as read");
});
exports.registerFcmToken = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    await authService.registerFcmToken(req.user._id.toString(), req.body.token);
    return (0, response_js_1.sendSuccess)(res, null, "FCM token registered");
});
exports.getTransactions = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const result = await (0, pagination_js_1.paginate)({
        model: Transaction_js_1.default,
        filter: { userId: req.user._id },
        query: req.query,
        sort: { createdAt: -1 },
    });
    return (0, response_js_1.sendPaginated)(res, result);
});
//# sourceMappingURL=user.controller.js.map