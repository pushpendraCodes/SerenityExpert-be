"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsQuerySchema = exports.pushNotificationSchema = exports.resolveReportSchema = exports.createCouponSchema = exports.createBannerSchema = exports.createFaqSchema = exports.createCategorySchema = exports.updateSettingsSchema = exports.approveExpertSchema = exports.createExpertSchema = exports.walletAdjustmentSchema = exports.manageUserSchema = void 0;
const zod_1 = require("zod");
const index_js_1 = require("../types/index.js");
exports.manageUserSchema = zod_1.z.object({
    isBlocked: zod_1.z.boolean().optional(),
    role: zod_1.z.enum(["user", "expert", "admin"]).optional(),
});
exports.walletAdjustmentSchema = zod_1.z.object({
    amount: zod_1.z.number(),
    description: zod_1.z.string().min(3).max(500),
    type: zod_1.z.enum(["credit", "debit"]),
});
exports.createExpertSchema = zod_1.z.object({
    mobile: zod_1.z.string().regex(/^\+?[1-9]\d{9,14}$/, "Invalid mobile number"),
    name: zod_1.z.string().min(2).max(100),
    bio: zod_1.z.string().max(1000).optional(),
    experience: zod_1.z.number().min(0).optional(),
    categories: zod_1.z.array(zod_1.z.string()).min(1, "At least one category required"),
    languages: zod_1.z.array(zod_1.z.string()).min(1).optional(),
    pricePerMinute: zod_1.z.number().min(0).optional(),
    commissionPercent: zod_1.z.number().min(0).max(100).optional(),
    bankDetails: zod_1.z.object({
        accountName: zod_1.z.string().min(1),
        accountNumber: zod_1.z.string().min(1),
        ifscCode: zod_1.z.string().min(1),
        bankName: zod_1.z.string().min(1),
        upiId: zod_1.z.string().optional(),
    }).optional(),
});
exports.approveExpertSchema = zod_1.z.object({
    isApproved: zod_1.z.boolean(),
    rejectionReason: zod_1.z.string().optional(),
    pricePerMinute: zod_1.z.number().min(0).optional(),
    commissionPercent: zod_1.z.number().min(0).max(100).optional(),
});
exports.updateSettingsSchema = zod_1.z.object({
    settings: zod_1.z.array(zod_1.z.object({
        key: zod_1.z.string().min(1),
        value: zod_1.z.string().min(1),
        description: zod_1.z.string().optional(),
    })),
});
exports.createCategorySchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100),
    slug: zod_1.z.string().min(2).max(100).optional(),
    description: zod_1.z.string().max(500).optional(),
    icon: zod_1.z.string().optional(),
    order: zod_1.z.number().int().optional(),
});
exports.createFaqSchema = zod_1.z.object({
    question: zod_1.z.string().min(5).max(500),
    answer: zod_1.z.string().min(5).max(5000),
    category: zod_1.z.string().optional(),
    order: zod_1.z.number().int().optional(),
});
exports.createBannerSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(200),
    imageUrl: zod_1.z.string().url(),
    link: zod_1.z.string().url().optional(),
    position: zod_1.z.string().optional(),
    startDate: zod_1.z.string().datetime().optional(),
    endDate: zod_1.z.string().datetime().optional(),
});
exports.createCouponSchema = zod_1.z.object({
    code: zod_1.z.string().min(3).max(30),
    discountType: zod_1.z.nativeEnum(index_js_1.DiscountType),
    discountValue: zod_1.z.number().min(0),
    minAmount: zod_1.z.number().min(0).optional(),
    maxDiscount: zod_1.z.number().min(0).optional(),
    usageLimit: zod_1.z.number().int().min(1).optional(),
    validFrom: zod_1.z.string().datetime().optional(),
    validTo: zod_1.z.string().datetime().optional(),
});
exports.resolveReportSchema = zod_1.z.object({
    status: zod_1.z.enum(["reviewed", "resolved"]),
    action: zod_1.z.string().optional(),
});
exports.pushNotificationSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(200),
    body: zod_1.z.string().min(1).max(1000),
    userIds: zod_1.z.array(zod_1.z.string()).optional(),
    role: zod_1.z.enum(["user", "expert", "all"]).optional(),
});
exports.analyticsQuerySchema = zod_1.z.object({
    period: zod_1.z.enum(["week", "month", "year"]).optional(),
});
//# sourceMappingURL=admin.validator.js.map