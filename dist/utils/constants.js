"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationType = exports.ReportStatus = exports.PayoutStatus = exports.RechargeStatus = exports.TransactionType = exports.ChatStatus = exports.CallStatus = exports.ExpertStatus = exports.UserRole = exports.DUMMY_AVATARS = exports.DEFAULT_COMMISSION_PERCENT = exports.NOTIFICATION_TTL_DAYS = exports.OTP_RATE_LIMIT_MAX = exports.RATE_LIMIT_MAX_REQUESTS = exports.RATE_LIMIT_WINDOW_MS = exports.ALLOWED_IMAGE_TYPES = exports.MAX_CHAT_IMAGE_SIZE = exports.MAX_AVATAR_SIZE = exports.MIN_CALL_DURATION_SECONDS = exports.BILLING_INTERVAL_MS = exports.CALL_RING_TIMEOUT_SECONDS = exports.LOW_BALANCE_WARNING_MINUTES = exports.MAX_RECHARGE_AMOUNT = exports.MIN_RECHARGE_AMOUNT = exports.MAX_LIMIT = exports.DEFAULT_LIMIT = exports.DEFAULT_PAGE = exports.OTP_RESEND_COOLDOWN_SECONDS = exports.OTP_MAX_ATTEMPTS = exports.OTP_EXPIRY_MINUTES = exports.OTP_LENGTH = exports.APP_NAME = void 0;
exports.generateDummyUsername = generateDummyUsername;
exports.generateDummyAvatar = generateDummyAvatar;
const index_js_1 = require("../types/index.js");
Object.defineProperty(exports, "UserRole", { enumerable: true, get: function () { return index_js_1.UserRole; } });
Object.defineProperty(exports, "ExpertStatus", { enumerable: true, get: function () { return index_js_1.ExpertStatus; } });
Object.defineProperty(exports, "CallStatus", { enumerable: true, get: function () { return index_js_1.CallStatus; } });
Object.defineProperty(exports, "ChatStatus", { enumerable: true, get: function () { return index_js_1.ChatStatus; } });
Object.defineProperty(exports, "TransactionType", { enumerable: true, get: function () { return index_js_1.TransactionType; } });
Object.defineProperty(exports, "RechargeStatus", { enumerable: true, get: function () { return index_js_1.RechargeStatus; } });
Object.defineProperty(exports, "PayoutStatus", { enumerable: true, get: function () { return index_js_1.PayoutStatus; } });
Object.defineProperty(exports, "ReportStatus", { enumerable: true, get: function () { return index_js_1.ReportStatus; } });
Object.defineProperty(exports, "NotificationType", { enumerable: true, get: function () { return index_js_1.NotificationType; } });
// ─── App Constants ────────────────────────────────────────────────────────────
exports.APP_NAME = "Expert Consultant";
// ─── Auth ─────────────────────────────────────────────────────────────────────
exports.OTP_LENGTH = 6;
exports.OTP_EXPIRY_MINUTES = 5;
exports.OTP_MAX_ATTEMPTS = 10;
exports.OTP_RESEND_COOLDOWN_SECONDS = 60;
// ─── Pagination ───────────────────────────────────────────────────────────────
exports.DEFAULT_PAGE = 1;
exports.DEFAULT_LIMIT = 20;
exports.MAX_LIMIT = 100;
// ─── Wallet ───────────────────────────────────────────────────────────────────
exports.MIN_RECHARGE_AMOUNT = 50; // INR
exports.MAX_RECHARGE_AMOUNT = 10000; // INR
exports.LOW_BALANCE_WARNING_MINUTES = 2; // Warn user when balance can cover only 2 more minutes
// ─── Call ──────────────────────────────────────────────────────────────────────
exports.CALL_RING_TIMEOUT_SECONDS = 60;
exports.BILLING_INTERVAL_MS = 1000; // Per-second billing
exports.MIN_CALL_DURATION_SECONDS = 0;
// ─── Upload ───────────────────────────────────────────────────────────────────
exports.MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB
exports.MAX_CHAT_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
exports.ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
// ─── Rate Limiting ────────────────────────────────────────────────────────────
exports.RATE_LIMIT_WINDOW_MS = 2 * 60 * 1000; // 15 minutes
exports.RATE_LIMIT_MAX_REQUESTS = 100;
exports.OTP_RATE_LIMIT_MAX = 10; // 5 OTP requests per window
// ─── Notification ─────────────────────────────────────────────────────────────
/** Default fallback when AdminSettings.notification_retention_days is unset */
exports.NOTIFICATION_TTL_DAYS = 90;
// ─── Payout ───────────────────────────────────────────────────────────────────
exports.DEFAULT_COMMISSION_PERCENT = 20;
// ─── Dummy User Data ──────────────────────────────────────────────────────────
exports.DUMMY_AVATARS = [
    "https://api.dicebear.com/9.x/avataaars/svg?seed=user1",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=user2",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=user3",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=user4",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=user5",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=user6",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=user7",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=user8",
];
const adjectives = [
    "Happy", "Brave", "Calm", "Kind", "Wise", "Bold", "Cool", "Swift",
    "Gentle", "Lucky", "Noble", "Quiet", "Sunny", "Warm", "Eager", "Free",
];
const nouns = [
    "Star", "Moon", "Sky", "Wave", "Bird", "Tree", "Cloud", "River",
    "Light", "Wind", "Sun", "Leaf", "Rose", "Peak", "Bay", "Fox",
];
function generateDummyUsername() {
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const num = Math.floor(Math.random() * 9999) + 1;
    return `${adj}${noun}${num}`;
}
function generateDummyAvatar(seed) {
    const s = seed || Math.random().toString(36).substring(7);
    return `https://api.dicebear.com/9.x/avataaars/svg?seed=${s}`;
}
//# sourceMappingURL=constants.js.map