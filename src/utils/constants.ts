import { UserRole, ExpertStatus, CallStatus, ChatStatus, TransactionType, RechargeStatus, PayoutStatus, ReportStatus, NotificationType } from "../types/index.js";

// ─── App Constants ────────────────────────────────────────────────────────────

export const APP_NAME = "Expert Consultant";

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const OTP_LENGTH = 6;
export const OTP_EXPIRY_MINUTES = 5;
export const OTP_MAX_ATTEMPTS = 10;
export const OTP_RESEND_COOLDOWN_SECONDS = 60;

// ─── Pagination ───────────────────────────────────────────────────────────────

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

// ─── Wallet ───────────────────────────────────────────────────────────────────

export const MIN_RECHARGE_AMOUNT = 50;   // INR
export const MAX_RECHARGE_AMOUNT = 10000; // INR
export const LOW_BALANCE_WARNING_MINUTES = 2; // Warn user when balance can cover only 2 more minutes

// ─── Call ──────────────────────────────────────────────────────────────────────

export const CALL_RING_TIMEOUT_SECONDS = 60;
export const BILLING_INTERVAL_MS = 1000; // Per-second billing
export const MIN_CALL_DURATION_SECONDS = 0;

// ─── Upload ───────────────────────────────────────────────────────────────────

export const MAX_AVATAR_SIZE = 5 * 1024 * 1024;  // 5MB
export const MAX_CHAT_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

// ─── Rate Limiting ────────────────────────────────────────────────────────────

export const RATE_LIMIT_WINDOW_MS = 2 * 60 * 1000; // 15 minutes
export const RATE_LIMIT_MAX_REQUESTS = 100;
export const OTP_RATE_LIMIT_MAX = 10; // 5 OTP requests per window

// ─── Notification ─────────────────────────────────────────────────────────────

export const NOTIFICATION_TTL_DAYS = 90;

// ─── Payout ───────────────────────────────────────────────────────────────────

export const DEFAULT_COMMISSION_PERCENT = 20;

// ─── Dummy User Data ──────────────────────────────────────────────────────────

export const DUMMY_AVATARS = [
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

export function generateDummyUsername(): string {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 9999) + 1;
  return `${adj}${noun}${num}`;
}

export function generateDummyAvatar(seed?: string): string {
  const s = seed || Math.random().toString(36).substring(7);
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${s}`;
}

// Re-export enums for convenience
export {
  UserRole,
  ExpertStatus,
  CallStatus,
  ChatStatus,
  TransactionType,
  RechargeStatus,
  PayoutStatus,
  ReportStatus,
  NotificationType,
};
