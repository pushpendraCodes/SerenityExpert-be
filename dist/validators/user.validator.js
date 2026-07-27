"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginationSchema = exports.fcmTokenSchema = exports.verifyPaymentSchema = exports.rechargeWalletSchema = exports.completeProfileSchema = exports.updateProfileSchema = void 0;
const zod_1 = require("zod");
const constants_js_1 = require("../utils/constants.js");
const index_js_1 = require("../types/index.js");
exports.updateProfileSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100).optional(),
    email: zod_1.z.string().email().optional(),
    gender: zod_1.z.nativeEnum(index_js_1.Gender).optional(),
    country: zod_1.z.string().min(2).max(100).optional(),
    city: zod_1.z.string().min(2).max(100).optional(),
    state: zod_1.z.string().min(2).max(100).optional(),
});
exports.completeProfileSchema = zod_1.z.object({
    realName: zod_1.z.string().min(2).max(100),
    dob: zod_1.z
        .string()
        .refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date of birth")
        .refine((v) => {
        const d = new Date(v);
        const age = (Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000);
        return age >= 13 && age <= 120;
    }, "You must be at least 13 years old"),
    gender: zod_1.z.nativeEnum(index_js_1.Gender),
    country: zod_1.z.string().min(2).max(100),
    city: zod_1.z.string().min(2).max(100),
    state: zod_1.z.string().min(2).max(100),
});
exports.rechargeWalletSchema = zod_1.z.object({
    amount: zod_1.z.number().min(constants_js_1.MIN_RECHARGE_AMOUNT).max(constants_js_1.MAX_RECHARGE_AMOUNT),
    couponCode: zod_1.z.string().optional(),
});
exports.verifyPaymentSchema = zod_1.z.object({
    razorpayOrderId: zod_1.z.string().min(1),
    razorpayPaymentId: zod_1.z.string().min(1),
    razorpaySignature: zod_1.z.string().min(1),
});
exports.fcmTokenSchema = zod_1.z.object({
    token: zod_1.z.string().min(1),
});
exports.paginationSchema = zod_1.z
    .object({
    page: zod_1.z.coerce.number().int().min(1).optional(),
    limit: zod_1.z.coerce.number().int().min(1).max(100).optional(),
    sort: zod_1.z.string().optional(),
    order: zod_1.z.enum(["asc", "desc"]).optional(),
})
    .passthrough();
//# sourceMappingURL=user.validator.js.map