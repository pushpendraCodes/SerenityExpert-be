import { z } from "zod";
import { MIN_RECHARGE_AMOUNT, MAX_RECHARGE_AMOUNT } from "../utils/constants.js";
import { Gender } from "../types/index.js";

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  gender: z.nativeEnum(Gender).optional(),
  country: z.string().min(2).max(100).optional(),
  city: z.string().min(2).max(100).optional(),
  state: z.string().min(2).max(100).optional(),
});

export const completeProfileSchema = z.object({
  realName: z.string().min(2).max(100),
  dob: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date of birth")
    .refine((v) => {
      const d = new Date(v);
      const age = (Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000);
      return age >= 13 && age <= 120;
    }, "You must be at least 13 years old"),
  gender: z.nativeEnum(Gender),
  country: z.string().min(2).max(100),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
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
  .passthrough();
