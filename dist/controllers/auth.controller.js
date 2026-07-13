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
exports.logout = exports.refreshToken = exports.googleLogin = exports.verifyOtp = exports.sendOtp = exports.verifyExpertOtp = exports.sendExpertOtp = void 0;
const authService = __importStar(require("../services/auth.service.js"));
const Expert_js_1 = __importDefault(require("../models/Expert.js"));
const AppError_js_1 = require("../utils/AppError.js");
const response_js_1 = require("../utils/response.js");
const asyncHandler_js_1 = require("../utils/asyncHandler.js");
exports.sendExpertOtp = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const { phone } = req.body;
    await authService.sendExpertOtp(phone);
    return (0, response_js_1.sendSuccess)(res, null, "OTP sent successfully");
});
exports.verifyExpertOtp = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const { phone, otp } = req.body;
    const result = await authService.loginExpertWithOtp(phone, otp);
    return (0, response_js_1.sendCreated)(res, {
        user: result.user,
        expert: result.expert,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
    }, "Expert login successful");
});
exports.sendOtp = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const { phone } = req.body;
    const expert = await Expert_js_1.default.findOne({ mobile: phone });
    if (expert) {
        throw new AppError_js_1.AuthError("This mobile number is registered as an expert. Please use expert login.");
    }
    const { sendOtp: sendOtpFn } = await import("../services/otp.service.js");
    const otp = await sendOtpFn(phone);
    const isDev = process.env.NODE_ENV !== "production";
    return (0, response_js_1.sendSuccess)(res, isDev ? { otp } : null, "OTP sent successfully");
});
exports.verifyOtp = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const { phone, otp } = req.body;
    const result = await authService.loginWithOtp(phone, otp);
    return (0, response_js_1.sendCreated)(res, {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        isNewUser: result.isNewUser,
    }, "Login successful");
});
exports.googleLogin = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const { idToken } = req.body;
    const result = await authService.loginWithGoogle(idToken);
    return (0, response_js_1.sendCreated)(res, {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        isNewUser: result.isNewUser,
    }, "Login successful");
});
exports.refreshToken = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const { refreshToken: token } = req.body;
    const tokens = await authService.refreshAccessToken(token);
    return (0, response_js_1.sendSuccess)(res, tokens, "Token refreshed");
});
exports.logout = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    await authService.logout(req.user._id.toString());
    return (0, response_js_1.sendSuccess)(res, null, "Logged out successfully");
});
//# sourceMappingURL=auth.controller.js.map