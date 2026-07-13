"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OTP_LENGTH = void 0;
exports.sendOtp = sendOtp;
exports.verifyOtp = verifyOtp;
const redis_js_1 = require("../config/redis.js");
const constants_js_1 = require("../utils/constants.js");
Object.defineProperty(exports, "OTP_LENGTH", { enumerable: true, get: function () { return constants_js_1.OTP_LENGTH; } });
const AppError_js_1 = require("../utils/AppError.js");
const OTP_PREFIX = "otp:";
const COOLDOWN_PREFIX = "otp:cooldown:";
function generateOtpCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
async function sendSms(phone, otp) {
    // Pluggable SMS provider — logs in dev, swap with Twilio/MSG91 in production
    if (process.env.NODE_ENV === "production" && process.env.SMS_PROVIDER_URL) {
        // TODO: integrate SMS provider
        console.log(`SMS to ${phone}: OTP ${otp}`);
    }
    else {
        console.log(`📱 OTP for ${phone}: ${otp}`);
    }
}
async function sendOtp(phone) {
    const redis = (0, redis_js_1.getRedisClient)();
    const cooldownKey = `${COOLDOWN_PREFIX}${phone}`;
    const onCooldown = await redis.get(cooldownKey);
    if (onCooldown) {
        throw new AppError_js_1.TooManyRequestsError(`Please wait ${constants_js_1.OTP_RESEND_COOLDOWN_SECONDS} seconds before requesting another OTP`);
    }
    const otp = generateOtpCode();
    const key = `${OTP_PREFIX}${phone}`;
    await redis.setEx(key, constants_js_1.OTP_EXPIRY_MINUTES * 60, JSON.stringify({ otp, attempts: 0 }));
    await redis.setEx(cooldownKey, constants_js_1.OTP_RESEND_COOLDOWN_SECONDS, "1");
    await sendSms(phone, otp);
    return otp;
}
async function verifyOtp(phone, otp) {
    const redis = (0, redis_js_1.getRedisClient)();
    const key = `${OTP_PREFIX}${phone}`;
    const data = await redis.get(key);
    if (!data) {
        throw new AppError_js_1.AuthError("OTP expired or not found");
    }
    const parsed = JSON.parse(data);
    if (parsed.attempts >= constants_js_1.OTP_MAX_ATTEMPTS) {
        await redis.del(key);
        throw new AppError_js_1.AuthError("Maximum OTP attempts exceeded");
    }
    if (parsed.otp !== otp) {
        parsed.attempts += 1;
        await redis.setEx(key, constants_js_1.OTP_EXPIRY_MINUTES * 60, JSON.stringify(parsed));
        throw new AppError_js_1.AuthError("Invalid OTP");
    }
    await redis.del(key);
    return true;
}
//# sourceMappingURL=otp.service.js.map