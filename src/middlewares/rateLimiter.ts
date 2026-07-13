import rateLimit from "express-rate-limit";
import { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS, OTP_RATE_LIMIT_MAX } from "../utils/constants.js";

export const generalLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later" },
});

export const otpLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: OTP_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many OTP requests, please try again later" },
});

export const authLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many authentication attempts" },
});
