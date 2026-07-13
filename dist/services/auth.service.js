"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendExpertOtp = sendExpertOtp;
exports.loginExpertWithOtp = loginExpertWithOtp;
exports.loginWithOtp = loginWithOtp;
exports.loginWithGoogle = loginWithGoogle;
exports.refreshAccessToken = refreshAccessToken;
exports.logout = logout;
exports.registerFcmToken = registerFcmToken;
exports.removeFcmToken = removeFcmToken;
const User_js_1 = __importDefault(require("../models/User.js"));
const Expert_js_1 = __importDefault(require("../models/Expert.js"));
const otp_service_js_1 = require("./otp.service.js");
const expert_service_js_1 = require("./expert.service.js");
const token_js_1 = require("../utils/token.js");
const constants_js_1 = require("../utils/constants.js");
const index_js_1 = require("../types/index.js");
const AppError_js_1 = require("../utils/AppError.js");
async function sendExpertOtp(mobile) {
    await (0, expert_service_js_1.assertExpertCanLogin)(mobile);
    const { sendOtp } = await import("./otp.service.js");
    await sendOtp(mobile);
}
async function loginExpertWithOtp(mobile, otp) {
    const expert = await (0, expert_service_js_1.assertExpertCanLogin)(mobile);
    await (0, otp_service_js_1.verifyOtp)(mobile, otp);
    const user = await User_js_1.default.findById(expert.userId);
    if (!user || user.isBlocked) {
        throw new AppError_js_1.AuthError("Account not found or blocked");
    }
    user.isVerified = true;
    user.lastLoginAt = new Date();
    user.role = index_js_1.UserRole.EXPERT;
    await user.save();
    const tokens = (0, token_js_1.generateTokenPair)({ userId: user._id.toString(), role: index_js_1.UserRole.EXPERT });
    user.refreshToken = tokens.refreshToken;
    await user.save();
    return { user, expert, ...tokens, isNewUser: false };
}
async function loginWithOtp(phone, otp) {
    const expertAccount = await Expert_js_1.default.findOne({ mobile: phone });
    if (expertAccount) {
        throw new AppError_js_1.AuthError("This mobile number is registered as an expert. Please use expert login.");
    }
    await (0, otp_service_js_1.verifyOtp)(phone, otp);
    let user = await User_js_1.default.findOne({ phone });
    let isNewUser = false;
    if (!user) {
        isNewUser = true;
        user = await User_js_1.default.create({
            phone,
            name: (0, constants_js_1.generateDummyUsername)(),
            avatar: (0, constants_js_1.generateDummyAvatar)(phone),
            isVerified: true,
            role: index_js_1.UserRole.USER,
        });
    }
    else {
        user.isVerified = true;
        user.lastLoginAt = new Date();
        await user.save();
    }
    const tokens = (0, token_js_1.generateTokenPair)({ userId: user._id.toString(), role: user.role });
    user.refreshToken = tokens.refreshToken;
    await user.save();
    return { user, ...tokens, isNewUser };
}
async function loginWithGoogle(idToken) {
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    if (!response.ok) {
        throw new AppError_js_1.AuthError("Invalid Google token");
    }
    const googleUser = (await response.json());
    let user = await User_js_1.default.findOne({ googleId: googleUser.sub });
    let isNewUser = false;
    if (!user && googleUser.email) {
        user = await User_js_1.default.findOne({ email: googleUser.email });
        if (user) {
            user.googleId = googleUser.sub;
            await user.save();
        }
    }
    if (!user) {
        isNewUser = true;
        user = await User_js_1.default.create({
            phone: `google_${googleUser.sub.slice(0, 10)}`,
            name: googleUser.name || (0, constants_js_1.generateDummyUsername)(),
            email: googleUser.email,
            avatar: googleUser.picture || (0, constants_js_1.generateDummyAvatar)(googleUser.sub),
            googleId: googleUser.sub,
            isVerified: true,
            role: index_js_1.UserRole.USER,
        });
    }
    else {
        user.lastLoginAt = new Date();
        await user.save();
    }
    const tokens = (0, token_js_1.generateTokenPair)({ userId: user._id.toString(), role: user.role });
    user.refreshToken = tokens.refreshToken;
    await user.save();
    return { user, ...tokens, isNewUser };
}
async function refreshAccessToken(refreshToken) {
    const decoded = (0, token_js_1.verifyRefreshToken)(refreshToken);
    const user = await User_js_1.default.findById(decoded.userId).select("+refreshToken");
    if (!user || user.refreshToken !== refreshToken || user.isBlocked) {
        throw new AppError_js_1.AuthError("Invalid refresh token");
    }
    const tokens = (0, token_js_1.generateTokenPair)({ userId: user._id.toString(), role: user.role });
    user.refreshToken = tokens.refreshToken;
    await user.save();
    return tokens;
}
async function logout(userId) {
    await User_js_1.default.findByIdAndUpdate(userId, { $unset: { refreshToken: 1 } });
}
async function registerFcmToken(userId, token) {
    await User_js_1.default.findByIdAndUpdate(userId, { $addToSet: { fcmTokens: token } });
}
async function removeFcmToken(userId, token) {
    await User_js_1.default.findByIdAndUpdate(userId, { $pull: { fcmTokens: token } });
}
//# sourceMappingURL=auth.service.js.map