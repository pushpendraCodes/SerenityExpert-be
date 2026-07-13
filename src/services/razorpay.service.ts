import crypto from "crypto";
import { getRazorpay } from "../config/razorpay.js";
import Recharge from "../models/Recharge.js";
import Coupon from "../models/Coupon.js";
import { creditWallet } from "./wallet.service.js";
import { RechargeStatus, DiscountType } from "../types/index.js";
import { NotFoundError, ValidationError } from "../utils/AppError.js";

export async function createRechargeOrder(
  userId: string,
  amount: number,
  couponCode?: string
): Promise<{ orderId: string; amount: number; currency: string; key: string }> {
  let finalAmount = amount;
  let discountAmount = 0;

  if (couponCode) {
    const coupon = await Coupon.findOne({
      code: couponCode.toUpperCase(),
      isActive: true,
      validFrom: { $lte: new Date() },
      validTo: { $gte: new Date() },
    });

    if (!coupon) throw new ValidationError("Invalid or expired coupon");
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      throw new ValidationError("Coupon usage limit reached");
    }
    if (coupon.minAmount && amount < coupon.minAmount) {
      throw new ValidationError(`Minimum amount for this coupon is ₹${coupon.minAmount}`);
    }

    if (coupon.discountType === DiscountType.PERCENTAGE) {
      discountAmount = (amount * coupon.discountValue) / 100;
      if (coupon.maxDiscount) discountAmount = Math.min(discountAmount, coupon.maxDiscount);
    } else {
      discountAmount = coupon.discountValue;
    }
    finalAmount = Math.max(0, amount - discountAmount);
  }

  const razorpay = getRazorpay();
  const order = await razorpay.orders.create({
    amount: Math.round(finalAmount * 100),
    currency: "INR",
    receipt: `rc_${userId.slice(-6)}_${Date.now()}`,
    notes: { userId, originalAmount: amount.toString() },
  });

  await Recharge.create({
    userId,
    amount: finalAmount,
    razorpayOrderId: order.id,
    status: RechargeStatus.CREATED,
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

export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const body = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");
  return expected === signature;
}

export async function processPaymentVerification(
  orderId: string,
  paymentId: string,
  signature: string
): Promise<{ balanceAfter: number }> {
  if (!verifyPaymentSignature(orderId, paymentId, signature)) {
    throw new ValidationError("Invalid payment signature");
  }

  const recharge = await Recharge.findOne({ razorpayOrderId: orderId });
  if (!recharge) throw new NotFoundError("Recharge order");
  if (recharge.status === RechargeStatus.PAID) {
    const balance = await import("./wallet.service.js").then((m) => m.getBalance(recharge.userId.toString()));
    return { balanceAfter: balance };
  }

  recharge.razorpayPaymentId = paymentId;
  recharge.razorpaySignature = signature;
  recharge.status = RechargeStatus.PAID;
  await recharge.save();

  if (recharge.couponCode) {
    await Coupon.findOneAndUpdate(
      { code: recharge.couponCode },
      { $inc: { usedCount: 1 } }
    );
  }

  const { balanceAfter } = await creditWallet(
    recharge.userId.toString(),
    recharge.amount,
    `Wallet recharge of ₹${recharge.amount}`,
    {
      referenceId: recharge._id.toString(),
      referenceType: "recharge",
      razorpayPaymentId: paymentId,
      razorpayOrderId: orderId,
    }
  );

  return { balanceAfter };
}

export async function handleWebhook(payload: Record<string, unknown>): Promise<void> {
  const event = payload.event as string;
  const paymentEntity = (payload.payload as { payment?: { entity?: Record<string, string> } })
    ?.payment?.entity;

  if (event === "payment.captured" && paymentEntity) {
    const orderId = paymentEntity.order_id;
    const paymentId = paymentEntity.id;
    if (orderId && paymentId) {
      const recharge = await Recharge.findOne({ razorpayOrderId: orderId, status: RechargeStatus.CREATED });
      if (recharge) {
        await processPaymentVerification(orderId, paymentId, "webhook");
      }
    }
  }
}

export function verifyWebhookSignature(body: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return expected === signature;
}
