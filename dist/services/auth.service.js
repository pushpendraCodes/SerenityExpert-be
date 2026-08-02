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
exports.completeProfile = completeProfile;
const User_js_1 = __importDefault(require("../models/User.js"));
const Expert_js_1 = __importDefault(require("../models/Expert.js"));
const otp_service_js_1 = require("./otp.service.js");
const expert_service_js_1 = require("./expert.service.js");
const token_js_1 = require("../utils/token.js");
const constants_js_1 = require("../utils/constants.js");
const admin_service_js_1 = require("./admin.service.js");
const phone_js_1 = require("../utils/phone.js");
const index_js_1 = require("../types/index.js");
const AppError_js_1 = require("../utils/AppError.js");
async function resolveHasStaffProfile(userId) {
    const expert = await Expert_js_1.default.findOne({ userId, isApproved: true }).select("_id");
    return Boolean(expert);
}
async function issueTokens(user, roleOverride, portal = "user") {
    const hasStaffProfile = await resolveHasStaffProfile(user._id.toString());
    const role = roleOverride ?? user.role;
    const payload = {
        userId: user._id.toString(),
        role,
        hasStaffProfile,
        portal,
    };
    const tokens = (0, token_js_1.generateTokenPair)(payload);
    // Keep user-app and staff-portal sessions independent
    if (portal === "staff") {
        user.staffRefreshToken = tokens.refreshToken;
    }
    else {
        user.refreshToken = tokens.refreshToken;
    }
    await user.save();
    return { ...tokens, hasStaffProfile };
}
/** Staff portal OTP — same as expert login; dual-portal friendly */
async function sendExpertOtp(mobile) {
    const phone = (0, phone_js_1.normalizePhone)(mobile);
    await (0, expert_service_js_1.assertExpertCanLogin)(phone);
    const { sendOtp } = await import("./otp.service.js");
    return sendOtp(phone);
}
async function loginExpertWithOtp(mobile, otp) {
    const phone = (0, phone_js_1.normalizePhone)(mobile);
    const expert = await (0, expert_service_js_1.assertExpertCanLogin)(phone);
    await (0, otp_service_js_1.verifyOtp)(phone, otp);
    const user = await User_js_1.default.findById(expert.userId).select("+realName");
    if (!user || user.isBlocked) {
        throw new AppError_js_1.AuthError("Account not found or blocked");
    }
    user.isVerified = true;
    user.lastLoginAt = new Date();
    // Keep role as USER for dual-portal users; only elevate if already admin stays admin
    if (user.role !== index_js_1.UserRole.ADMIN) {
        // Do not flip identity away from user portal — staff access is via Expert link + hasStaffProfile
    }
    await user.save();
    const tokens = await issueTokens(user, user.role === index_js_1.UserRole.ADMIN ? index_js_1.UserRole.ADMIN : index_js_1.UserRole.USER, "staff");
    return {
        user,
        expert,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        hasStaffProfile: tokens.hasStaffProfile,
        isNewUser: false,
    };
}
async function loginWithOtp(phone, otp) {
    const normalized = (0, phone_js_1.normalizePhone)(phone);
    // Dual portal: expert/staff phones may also use the user app — do not block
    await (0, otp_service_js_1.verifyOtp)(normalized, otp);
    let user = await User_js_1.default.findOne({ phone: { $in: (0, phone_js_1.phoneLookupVariants)(normalized) } });
    let isNewUser = false;
    if (!user) {
        isNewUser = true;
        const freeSeconds = await (0, admin_service_js_1.getFreeCallingSeconds)(constants_js_1.FREE_SECONDS_ON_SIGNUP / 60);
        user = await User_js_1.default.create({
            phone: normalized,
            name: (0, constants_js_1.generateDummyUsername)(),
            avatar: (0, constants_js_1.generateDummyAvatar)(normalized),
            isVerified: true,
            role: index_js_1.UserRole.USER,
            profileCompleted: false,
            freeSecondsRemaining: freeSeconds,
        });
    }
    else {
        user.isVerified = true;
        user.lastLoginAt = new Date();
        if (!user.phone.startsWith("+"))
            user.phone = normalized;
        await user.save();
    }
    const tokens = await issueTokens(user, undefined, "user");
    return {
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        hasStaffProfile: tokens.hasStaffProfile,
        isNewUser,
    };
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
        const freeSeconds = await (0, admin_service_js_1.getFreeCallingSeconds)(constants_js_1.FREE_SECONDS_ON_SIGNUP / 60);
        user = await User_js_1.default.create({
            phone: `google_${googleUser.sub.slice(0, 10)}`,
            name: googleUser.name || (0, constants_js_1.generateDummyUsername)(),
            email: googleUser.email,
            avatar: googleUser.picture || (0, constants_js_1.generateDummyAvatar)(googleUser.sub),
            googleId: googleUser.sub,
            isVerified: true,
            role: index_js_1.UserRole.USER,
            profileCompleted: false,
            freeSecondsRemaining: freeSeconds,
        });
    }
    else {
        user.lastLoginAt = new Date();
        await user.save();
    }
    const tokens = await issueTokens(user, undefined, "user");
    return {
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        hasStaffProfile: tokens.hasStaffProfile,
        isNewUser,
    };
}
async function refreshAccessToken(refreshToken) {
    const decoded = (0, token_js_1.verifyRefreshToken)(refreshToken);
    const user = await User_js_1.default.findById(decoded.userId).select("+refreshToken +staffRefreshToken");
    if (!user || user.isBlocked) {
        throw new AppError_js_1.AuthError("Invalid refresh token");
    }
    const portal = decoded.portal === "staff" || user.staffRefreshToken === refreshToken ? "staff" : "user";
    const stored = portal === "staff" ? user.staffRefreshToken : user.refreshToken;
    if (!stored || stored !== refreshToken) {
        throw new AppError_js_1.AuthError("Invalid refresh token");
    }
    return issueTokens(user, decoded.role, portal);
}
async function logout(userId, portal = "user") {
    if (portal === "staff") {
        await User_js_1.default.findByIdAndUpdate(userId, { $unset: { staffRefreshToken: 1 } });
        return;
    }
    if (portal === "all") {
        await User_js_1.default.findByIdAndUpdate(userId, { $unset: { refreshToken: 1, staffRefreshToken: 1 } });
        return;
    }
    await User_js_1.default.findByIdAndUpdate(userId, { $unset: { refreshToken: 1 } });
}
async function registerFcmToken(userId, token) {
    await User_js_1.default.findByIdAndUpdate(userId, { $addToSet: { fcmTokens: token } });
}
async function removeFcmToken(userId, token) {
    await User_js_1.default.findByIdAndUpdate(userId, { $pull: { fcmTokens: token } });
}
async function completeProfile(userId, data) {
    const user = await User_js_1.default.findById(userId);
    if (!user)
        throw new AppError_js_1.AuthError("User not found");
    // Real name + DOB are stored privately; the public `name` stays a dummy handle.
    user.realName = data.realName.trim();
    user.dob = new Date(data.dob);
    user.gender = data.gender;
    user.country = data.country.trim();
    user.city = data.city.trim();
    user.state = data.state.trim();
    user.profileCompleted = true;
    await user.save();
    return user;
}
//# sourceMappingURL=auth.service.js.map