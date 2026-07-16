import { z } from "zod";
import { MIN_RECHARGE_AMOUNT, MAX_RECHARGE_AMOUNT } from "../utils/constants.js";

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
});

export const rechargeWalletSchema = z.object({
  amount: z.number().min(MIN_RECHARGE_AMOUNT).max(MAX_RECHARGE_AMOUNT),
  couponCode: z.string().optional(),
});

export const verifyPaymentSchema = z.object({
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

export const fcmTokenSchema = z.object({
  token: z.string().min(1),
});

export const paginationSchema = z
  .object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    sort: z.string().optional(),
    order: z.enum(["asc", "desc"]).optional(),
  })
  // Keep extra filter params (search, approved, role, type, status, filter, ...)
  // so list controllers can read them — plain objects strip unknown keys.
  .passthrough();
