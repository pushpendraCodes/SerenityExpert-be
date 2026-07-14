// ─── Enums ────────────────────────────────────────────────────────────────────

export enum UserRole {
  USER = "user",
  EXPERT = "expert",
  ADMIN = "admin",
}

export enum ExpertStatus {
  ONLINE = "online",
  OFFLINE = "offline",
  BUSY = "busy",
}

export enum CallStatus {
  RINGING = "ringing",
  ACTIVE = "active",
  COMPLETED = "completed",
  MISSED = "missed",
  REJECTED = "rejected",
  FAILED = "failed",
}

export enum ChatStatus {
  ACTIVE = "active",
  CLOSED = "closed",
}

export enum MessageType {
  TEXT = "text",
  IMAGE = "image",
  SYSTEM = "system",
}

export enum TransactionType {
  RECHARGE = "recharge",
  DEDUCTION = "deduction",
  REFUND = "refund",
  PAYOUT = "payout",
  ADJUSTMENT = "adjustment",
}

export enum TransactionStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed",
}

export enum RechargeStatus {
  CREATED = "created",
  PAID = "paid",
  FAILED = "failed",
}

export enum PayoutStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
}

export enum ReportStatus {
  PENDING = "pending",
  REVIEWED = "reviewed",
  RESOLVED = "resolved",
}

export enum NotificationType {
  CALL = "call",
  CHAT = "chat",
  COMMUNITY = "community",
  PAYMENT = "payment",
  SYSTEM = "system",
  PROMO = "promo",
}

export enum DiscountType {
  PERCENTAGE = "percentage",
  FLAT = "flat",
}

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface AvailabilitySlot {
  day: "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
  startTime: string; // HH:mm format
  endTime: string;   // HH:mm format
}

export interface BankDetails {
  accountName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  upiId?: string;
}

export interface TokenPayload {
  userId: string;
  role: UserRole;
}

export interface OtpData {
  phone: string;
  otp: string;
  expiresAt: Date;
  attempts: number;
}

// ─── Socket Events ────────────────────────────────────────────────────────────

export interface ServerToClientEvents {
  "message:received": (data: { chatId: string; message: unknown }) => void;
  "message:read": (data: { chatId: string; readBy: string }) => void;
  "typing:start": (data: { chatId: string; userId: string }) => void;
  "typing:stop": (data: { chatId: string; userId: string }) => void;
  "call:incoming": (data: {
    callId: string;
    callerName: string;
    callerAvatar: string;
    pricePerMinute?: number;
  }) => void;
  "call:accepted": (data: { callId: string; agoraToken: string; channelName: string }) => void;
  "call:rejected": (data: { callId: string; reason?: string }) => void;
  "call:cancelled": (data: { callId: string; reason?: string }) => void;
  "call:ended": (data: {
    callId: string;
    duration: number;
    cost: number;
    status?: string;
    recordingUrl?: string;
  }) => void;
  "call:timer": (data: { callId: string; elapsed: number; cost: number; balance: number }) => void;
  "call:low-balance": (data: { callId: string; balance: number; minutesRemaining: number }) => void;
  "call:recording-ready": (data: { callId: string; recordingUrl: string }) => void;
  "expert:status-changed": (data: { expertId: string; status: ExpertStatus }) => void;
  "notification:new": (data: {
    id: string;
    title: string;
    body: string;
    type: NotificationType;
    data?: Record<string, unknown>;
  }) => void;
}

export interface ClientToServerEvents {
  "chat:join": (chatId: string) => void;
  "chat:leave": (chatId: string) => void;
  "message:send": (data: { chatId: string; content: string; messageType: MessageType }) => void;
  "message:read": (chatId: string) => void;
  "typing:start": (chatId: string) => void;
  "typing:stop": (chatId: string) => void;
  "call:initiate": (data: { expertId: string }) => void;
  "call:accept": (callId: string) => void;
  "call:reject": (callId: string) => void;
  "call:end": (callId: string) => void;
  "expert:update-status": (status: ExpertStatus) => void;
}
