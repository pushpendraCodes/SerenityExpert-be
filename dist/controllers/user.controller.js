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
exports.getTransactions = exports.registerFcmToken = exports.markNotificationRead = exports.getNotifications = exports.getHistory = exports.getWallet = exports.uploadAvatar = exports.completeProfile = exports.updateProfile = exports.getMe = void 0;
const User_js_1 = __importDefault(require("../models/User.js"));
const Expert_js_1 = __importDefault(require("../models/Expert.js"));
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
    // realName + dob are select:false (private) — explicitly include them for the owner only.
    const user = await User_js_1.default.findById(req.user._id).select("+realName +dob");
    const staff = await Expert_js_1.default.findOne({ userId: req.user._id, isApproved: true }).select("_id status isApproved pricePerMinute");
    return (0, response_js_1.sendSuccess)(res, {
        ...user?.toJSON(),
        hasStaffProfile: Boolean(staff),
        staffProfile: staff || undefined,
    });
});
exports.updateProfile = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const { email, gender, country, city, state } = req.body;
    const updates = {};
    // Public handle (`name`) is immutable after signup
    if (email)
        updates.email = email;
    if (gender)
        updates.gender = gender;
    if (country)
        updates.country = country;
    if (city)
        updates.city = city;
    if (state)
        updates.state = state;
    const user = await User_js_1.default.findByIdAndUpdate(req.user._id, updates, {
        new: true,
        runValidators: true,
    });
    return (0, response_js_1.sendSuccess)(res, user, "Profile updated");
});
exports.completeProfile = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const user = await authService.completeProfile(req.user._id.toString(), req.body);
    return (0, response_js_1.sendSuccess)(res, user, "Profile completed");
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
    const user = await User_js_1.default.findById(req.user._id).select("walletBalance freeSecondsRemaining");
    const transactions = await Transaction_js_1.default.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .limit(10);
    return (0, response_js_1.sendSuccess)(res, {
        balance: user?.walletBalance ?? 0,
        freeSecondsRemaining: user?.freeSecondsRemaining ?? 0,
        recentTransactions: transactions,
    });
});
exports.getHistory = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const userId = req.user._id;
    const [calls, chats, recharges] = await Promise.all([
        Call_js_1.default.find({ userId })
            .sort({ createdAt: -1 })
            .limit(20)
            .populate({ path: "expertId", populate: { path: "userId", select: "name avatar" } }),
        Chat_js_1.default.find({ userId })
            .sort({ updatedAt: -1 })
            .limit(20)
            .populate({ path: "expertId", populate: { path: "userId", select: "name avatar" } }),
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