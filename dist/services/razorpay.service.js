"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRechargeOrder = createRechargeOrder;
exports.verifyPaymentSignature = verifyPaymentSignature;
exports.processPaymentVerification = processPaymentVerification;
exports.handleWebhook = handleWebhook;
exports.verifyWebhookSignature = verifyWebhookSignature;
const crypto_1 = __importDefault(require("crypto"));
const razorpay_js_1 = require("../config/razorpay.js");
const Recharge_js_1 = __importDefault(require("../models/Recharge.js"));
const Coupon_js_1 = __importDefault(require("../models/Coupon.js"));
const wallet_service_js_1 = require("./wallet.service.js");
const index_js_1 = require("../types/index.js");
const AppError_js_1 = require("../utils/AppError.js");
async function createRechargeOrder(userId, amount, couponCode) {
    let finalAmount = amount;
    let discountAmount = 0;
    if (couponCode) {
        const coupon = await Coupon_js_1.default.findOne({
            code: couponCode.toUpperCase(),
            isActive: true,
            validFrom: { $lte: new Date() },
            validTo: { $gte: new Date() },
        });
        if (!coupon)
            throw new AppError_js_1.ValidationError("Invalid or expired coupon");
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
            throw new AppError_js_1.ValidationError("Coupon usage limit reached");
        }
        if (coupon.minAmount && amount < coupon.minAmount) {
            throw new AppError_js_1.ValidationError(`Minimum amount for this coupon is ₹${coupon.minAmount}`);
        }
        if (coupon.discountType === index_js_1.DiscountType.PERCENTAGE) {
            discountAmount = (amount * coupon.discountValue) / 100;
            if (coupon.maxDiscount)
                discountAmount = Math.min(discountAmount, coupon.maxDiscount);
        }
        else {
            discountAmount = coupon.discountValue;
        }
        finalAmount = Math.max(0, amount - discountAmount);
    }
    const razorpay = (0, razorpay_js_1.getRazorpay)();
    const order = await razorpay.orders.create({
        amount: Math.round(finalAmount * 100),
        currency: "INR",
        receipt: `rc_${userId.slice(-6)}_${Date.now()}`,
        notes: { userId, originalAmount: amount.toString() },
    });
    await Recharge_js_1.default.create({
        userId,
        amount: finalAmount,
        razorpayOrderId: order.id,
        status: index_js_1.RechargeStatus.CREATED,
        couponCode: couponCode?.toUpperCase(),
        discountAmount,
    });
    return {
        orderId: order.id,
        amount: finalAmount,
        currency: "INR",
        key: process.env.RAZORPAY_KEY_ID,
    };
}
function verifyPaymentSignature(orderId, paymentId, signature) {
    const body = `${orderId}|${paymentId}`;
    const expected = crypto_1.default
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest("hex");
    return expected === signature;
}
async function processPaymentVerification(orderId, paymentId, signature) {
    if (!verifyPaymentSignature(orderId, paymentId, signature)) {
        throw new AppError_js_1.ValidationError("Invalid payment signature");
    }
    const recharge = await Recharge_js_1.default.findOne({ razorpayOrderId: orderId });
    if (!recharge)
        throw new AppError_js_1.NotFoundError("Recharge order");
    if (recharge.status === index_js_1.RechargeStatus.PAID) {
        const balance = await import("./wallet.service.js").then((m) => m.getBalance(recharge.userId.toString()));
        return { balanceAfter: balance };
    }
    recharge.razorpayPaymentId = paymentId;
    recharge.razorpaySignature = signature;
    recharge.status = index_js_1.RechargeStatus.PAID;
    await recharge.save();
    if (recharge.couponCode) {
        await Coupon_js_1.default.findOneAndUpdate({ code: recharge.couponCode }, { $inc: { usedCount: 1 } });
    }
    const { balanceAfter } = await (0, wallet_service_js_1.creditWallet)(recharge.userId.toString(), recharge.amount, `Wallet recharge of ₹${recharge.amount}`, {
        referenceId: recharge._id.toString(),
        referenceType: "recharge",
        razorpayPaymentId: paymentId,
        razorpayOrderId: orderId,
    });
    return { balanceAfter };
}
async function handleWebhook(payload) {
    const event = payload.event;
    const paymentEntity = payload.payload
        ?.payment?.entity;
    if (event === "payment.captured" && paymentEntity) {
        const orderId = paymentEntity.order_id;
        const paymentId = paymentEntity.id;
        if (orderId && paymentId) {
            const recharge = await Recharge_js_1.default.findOne({ razorpayOrderId: orderId, status: index_js_1.RechargeStatus.CREATED });
            if (recharge) {
                await processPaymentVerification(orderId, paymentId, "webhook");
            }
        }
    }
}
function verifyWebhookSignature(body, signature) {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret)
        return false;
    const expected = crypto_1.default.createHmac("sha256", secret).update(body).digest("hex");
    return expected === signature;
}
//# sourceMappingURL=razorpay.service.js.map