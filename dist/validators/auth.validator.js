"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshTokenSchema = exports.googleLoginSchema = exports.verifyOtpSchema = exports.sendOtpSchema = void 0;
const zod_1 = require("zod");
exports.sendOtpSchema = zod_1.z.object({
    phone: zod_1.z.string().regex(/^\+?[1-9]\d{9,14}$/, "Invalid phone number"),
});
exports.verifyOtpSchema = zod_1.z.object({
    phone: zod_1.z.string().regex(/^\+?[1-9]\d{9,14}$/, "Invalid phone number"),
    otp: zod_1.z.string().length(6, "OTP must be 6 digits"),
});
exports.googleLoginSchema = zod_1.z.object({
    idToken: zod_1.z.string().min(1, "Google ID token is required"),
});
exports.refreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1, "Refresh token is required"),
});
//# sourceMappingURL=auth.validator.js.map