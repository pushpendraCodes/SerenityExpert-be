import mongoose from "mongoose";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import { TransactionType, TransactionStatus } from "../types/index.js";
import { InsufficientBalanceError } from "../utils/AppError.js";

export async function getBalance(userId: string): Promise<number> {
  const user = await User.findById(userId).select("walletBalance");
  return user?.walletBalance ?? 0;
}

export async function creditWallet(
  userId: string,
  amount: number,
  description: string,
  meta: {
    referenceId?: string;
    referenceType?: "call" | "chat" | "recharge" | "payout" | "adjustment";
    razorpayPaymentId?: string;
    razorpayOrderId?: string;
    type?: TransactionType;
  } = {}
): Promise<{ balanceAfter: number; transactionId: string }> {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(userId).session(session);
    if (!user) throw new Error("User not found");

    const balanceBefore = user.walletBalance;
    const balanceAfter = balanceBefore + amount;

    user.walletBalance = balanceAfter;
    await user.save({ session });

    const [transaction] = await Transaction.create([{
      userId,
      type: meta.type || TransactionType.RECHARGE,
      amount,
      balanceBefore,
      balanceAfter,
      referenceId: meta.referenceId,
      referenceType: meta.referenceType,
      razorpayPaymentId: meta.razorpayPaymentId,
      razorpayOrderId: meta.razorpayOrderId,
      description,
      status: TransactionStatus.COMPLETED,
    }], { session });

    await session.commitTransaction();
    return { balanceAfter, transactionId: transaction._id.toString() };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

export async function debitWallet(
  userId: string,
  amount: number,
  description: string,
  meta: {
    referenceId?: string;
    referenceType?: "call" | "chat" | "recharge" | "payout" | "adjustment";
  } = {}
): Promise<{ balanceAfter: number; transactionId: string }> {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(userId).session(session);
    if (!user) throw new Error("User not found");

    if (user.walletBalance < amount) {
      throw new InsufficientBalanceError();
    }

    const balanceBefore = user.walletBalance;
    const balanceAfter = balanceBefore - amount;

    user.walletBalance = balanceAfter;
    await user.save({ session });

    const [transaction] = await Transaction.create([{
      userId,
      type: TransactionType.DEDUCTION,
      amount,
      balanceBefore,
      balanceAfter,
      referenceId: meta.referenceId,
      referenceType: meta.referenceType,
      description,
      status: TransactionStatus.COMPLETED,
    }], { session });

    await session.commitTransaction();
    return { balanceAfter, transactionId: transaction._id.toString() };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

export async function adjustWallet(
  userId: string,
  amount: number,
  type: "credit" | "debit",
  description: string,
  adminId: string
): Promise<{ balanceAfter: number }> {
  if (type === "credit") {
    const result = await creditWallet(userId, amount, description, {
      referenceType: "adjustment",
      referenceId: adminId,
      type: TransactionType.ADJUSTMENT,
    });
    return { balanceAfter: result.balanceAfter };
  }

  const result = await debitWallet(userId, amount, description, {
    referenceType: "adjustment",
    referenceId: adminId,
  });
  return { balanceAfter: result.balanceAfter };
}

/** Per-second billing: cost = (pricePerMinute / 60) * seconds */
export function calculateCallCost(pricePerMinute: number, durationSeconds: number): number {
  const costPerSecond = pricePerMinute / 60;
  return Math.ceil(costPerSecond * durationSeconds * 100) / 100;
}

export function canAffordCall(balance: number, pricePerMinute: number, minSeconds = 60): boolean {
  const minCost = calculateCallCost(pricePerMinute, minSeconds);
  return balance >= minCost;
}

export function minutesRemaining(balance: number, pricePerMinute: number): number {
  if (pricePerMinute <= 0) return Infinity;
  return Math.floor((balance / pricePerMinute) * 60) / 60;
}
