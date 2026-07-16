"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginationSchema = exports.fcmTokenSchema = exports.verifyPaymentSchema = exports.rechargeWalletSchema = exports.updateProfileSchema = void 0;
const zod_1 = require("zod");
const constants_js_1 = require("../utils/constants.js");
exports.updateProfileSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100).optional(),
    email: zod_1.z.string().email().optional(),
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
    // Keep extra filter params (search, approved, role, type, status, filter, ...)
    // so list controllers can read them — plain objects strip unknown keys.
    .passthrough();
//# sourceMappingURL=user.validator.js.map