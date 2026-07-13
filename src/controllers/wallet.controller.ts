import { Request, Response } from "express";
import * as razorpayService from "../services/razorpay.service.js";
import { sendSuccess, sendPaginated } from "../utils/response.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { paginate } from "../utils/pagination.js";
import Transaction from "../models/Transaction.js";

export const createRecharge = asyncHandler(async (req: Request, res: Response) => {
  const { amount, couponCode } = req.body;
  const order = await razorpayService.createRechargeOrder(req.user!._id.toString(), amount, couponCode);
  return sendSuccess(res, order, "Recharge order created");
});

export const verifyPayment = asyncHandler(async (req: Request, res: Response) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  const result = await razorpayService.processPaymentVerification(
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature
  );
  return sendSuccess(res, result, "Payment verified and wallet credited");
});

export const webhook = asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers["x-razorpay-signature"] as string;
  const rawBody = JSON.stringify(req.body);

  if (signature && !razorpayService.verifyWebhookSignature(rawBody, signature)) {
    return res.status(400).json({ success: false, message: "Invalid webhook signature" });
  }

  await razorpayService.handleWebhook(req.body);
  return res.status(200).json({ success: true });
});

export const getTransactions = asyncHandler(async (req: Request, res: Response) => {
  const result = await paginate({
    model: Transaction,
    filter: { userId: req.user!._id },
    query: req.query,
    sort: { createdAt: -1 },
  });
  return sendPaginated(res, result);
});
