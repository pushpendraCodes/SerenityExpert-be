import { z } from "zod";
import { DiscountType } from "../types/index.js";

export const manageUserSchema = z.object({
  isBlocked: z.boolean().optional(),
  role: z.enum(["user", "expert", "admin"]).optional(),
});

export const walletAdjustmentSchema = z.object({
  amount: z.number(),
  description: z.string().min(3).max(500),
  type: z.enum(["credit", "debit"]),
});

export const createExpertSchema = z.object({
  mobile: z.string().regex(/^\+?[1-9]\d{9,14}$/, "Invalid mobile number"),
  name: z.string().min(2).max(100),
  bio: z.string().max(1000).optional(),
  experience: z.number().min(0).optional(),
  categories: z.array(z.string()).min(1, "At least one category required"),
  languages: z.array(z.string()).min(1).optional(),
  pricePerMinute: z.number().min(0).optional(),
  commissionPercent: z.number().min(0).max(100).optional(),
  bankDetails: z.object({
    accountName: z.string().min(1),
    accountNumber: z.string().min(1),
    ifscCode: z.string().min(1),
    bankName: z.string().min(1),
    upiId: z.string().optional(),
  }).optional(),
});

export const approveExpertSchema = z.object({
  isApproved: z.boolean(),
  rejectionReason: z.string().optional(),
  pricePerMinute: z.number().min(0).optional(),
  commissionPercent: z.number().min(0).max(100).optional(),
});

export const updateSettingsSchema = z.object({
  settings: z.array(z.object({
    key: z.string().min(1),
    value: z.string().min(1),
    description: z.string().optional(),
  })),
});

export const createCategorySchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  icon: z.string().optional(),
  order: z.number().int().optional(),
});

export const createFaqSchema = z.object({
  question: z.string().min(5).max(500),
  answer: z.string().min(5).max(5000),
  category: z.string().optional(),
  order: z.number().int().optional(),
});

export const createBannerSchema = z.object({
  title: z.string().min(1).max(200),
  imageUrl: z.string().url(),
  link: z.string().url().optional(),
  position: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const createCouponSchema = z.object({
  code: z.string().min(3).max(30),
  discountType: z.nativeEnum(DiscountType),
  discountValue: z.number().min(0),
  minAmount: z.number().min(0).optional(),
  maxDiscount: z.number().min(0).optional(),
  usageLimit: z.number().int().min(1).optional(),
  validFrom: z.string().datetime().optional(),
  validTo: z.string().datetime().optional(),
});

export const resolveReportSchema = z.object({
  status: z.enum(["reviewed", "resolved"]),
  action: z.string().optional(),
});

export const pushNotificationSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(1000),
  userIds: z.array(z.string()).optional(),
  role: z.enum(["user", "expert", "all"]).optional(),
});

export const analyticsQuerySchema = z.object({
  period: z.enum(["week", "month", "year"]).optional(),
});
