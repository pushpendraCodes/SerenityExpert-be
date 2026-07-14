"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authLimiter = exports.otpLimiter = exports.generalLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const constants_js_1 = require("../utils/constants.js");
exports.generalLimiter = (0, express_rate_limit_1.default)({
    windowMs: constants_js_1.RATE_LIMIT_WINDOW_MS,
    max: constants_js_1.RATE_LIMIT_MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many requests, please try again later" },
});
exports.otpLimiter = (0, express_rate_limit_1.default)({
    windowMs: constants_js_1.RATE_LIMIT_WINDOW_MS,
    max: constants_js_1.OTP_RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many OTP requests, please try again later" },
});
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: constants_js_1.RATE_LIMIT_WINDOW_MS,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many authentication attempts" },
});
//# sourceMappingURL=rateLimiter.js.map