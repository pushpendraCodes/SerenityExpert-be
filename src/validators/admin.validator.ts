import { z } from "zod";
import { DiscountType, Gender } from "../types/index.js";

export const manageUserSchema = z.object({
  isBlocked: z.boolean().optional(),
  role: z.enum(["user", "expert", "admin"]).optional(),
});

export const walletAdjustmentSchema = z.object({
  amount: z.number(),
  description: z.string().min(3).max(500),
  type: z.enum(["credit", "debit"]),
});

const optionalBankDetailsSchema = z.object({
  accountName: z.string().optional(),
  accountNumber: z.string().optional(),
  ifscCode: z.string().optional(),
  bankName: z.string().optional(),
  upiId: z.string().optional(),
}).optional();

export const createExpertSchema = z.object({
  mobile: z.string().regex(/^\+?[1-9]\d{9,14}$/, "Invalid mobile number"),
  /** Public display / dummy handle shown on calls & website */
  name: z.string().min(2).max(100),
  realName: z.string().min(2).max(100),
  gender: z.nativeEnum(Gender),
  dob: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date of birth")
    .refine((v) => {
      const age = (Date.now() - new Date(v).getTime()) / (365.25 * 24 * 3600 * 1000);
      return age >= 13 && age <= 120;
    }, "Staff must be at least 13 years old"),
  country: z.string().min(2).max(100),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  bio: z.string().max(1000).optional(),
  experience: z.number().min(0).optional(),
  categories: z.array(z.string()).optional(),
  languages: z.array(z.string()).min(1).optional(),
  pricePerMinute: z.number().min(0).optional(),
  commissionPercent: z.number().min(0).max(100).optional(),
  bankDetails: optionalBankDetailsSchema,
  approveImmediately: z.boolean().optional(),
});

export const updateExpertSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  bio: z.string().max(1000).optional(),
  experience: z.number().min(0).optional(),
  categories: z.array(z.string()).optional(),
  languages: z.array(z.string()).min(1).optional(),
  pricePerMinute: z.number().min(0).optional(),
  commissionPercent: z.number().min(0).max(100).optional(),
  bankDetails: optionalBankDetailsSchema,
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

const bannerLinkSchema = z
  .string()
  .min(1)
  .max(500)
  .refine(
    (v) => v.startsWith("/") || /^https?:\/\//i.test(v),
    "Link must be a relative path or absolute URL"
  )
  .optional();

export const createBannerSchema = z
  .object({
    title: z.string().min(1).max(200),
    mediaType: z.enum(["image", "video"]).optional().default("image"),
    imageUrl: z.union([z.string().url(), z.literal("")]).optional(),
    videoUrl: z.union([z.string().url(), z.literal("")]).optional(),
    link: bannerLinkSchema,
    tagline: z.string().max(200).optional(),
    badge: z.string().max(40).optional(),
    position: z.enum(["home", "expert_list", "community"]).optional(),
    order: z.number().int().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  })
  .superRefine((data, ctx) => {
    const mediaType = data.mediaType ?? "image";
    if (mediaType === "video") {
      if (!data.videoUrl) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Video URL is required for video banners",
          path: ["videoUrl"],
        });
      }
    } else if (!data.imageUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Image URL is required for image banners",
        path: ["imageUrl"],
      });
    }
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

export const refundSchema = z.object({
  userId: z.string().min(1),
  amount: z.number().positive(),
  description: z.string().min(3).max(500),
  callId: z.string().optional(),
});

export const moderateQuestionSchema = z.object({
  isFlagged: z.boolean().optional(),
  isModerated: z.boolean().optional(),
  isDeleted: z.boolean().optional(),
});
