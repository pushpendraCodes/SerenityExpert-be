import Call from "../models/Call.js";
import Expert from "../models/Expert.js";
import Payout from "../models/Payout.js";
import { PayoutStatus, CallStatus } from "../types/index.js";
import { paginate } from "../utils/pagination.js";
import { createNotification } from "./notification.service.js";
import { NotificationType } from "../types/index.js";
import type { PaginationQuery } from "../types/index.js";

export async function calculateExpertEarnings(
  expertId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<{ grossAmount: number; commission: number; netAmount: number; callCount: number }> {
  const expert = await Expert.findById(expertId);
  if (!expert) return { grossAmount: 0, commission: 0, netAmount: 0, callCount: 0 };

  const calls = await Call.find({
    expertId,
    status: CallStatus.COMPLETED,
    endedAt: { $gte: periodStart, $lte: periodEnd },
  });

  const grossAmount = calls.reduce((sum, call) => sum + call.totalCost, 0);
  const commission = (grossAmount * expert.commissionPercent) / 100;
  const netAmount = grossAmount - commission;

  return { grossAmount, commission, netAmount, callCount: calls.length };
}

/**
 * Process unpaid earnings for approved experts.
 * Idempotent: each expert is paid only for the window after their last COMPLETED payout.
 * Safe to re-run (admin batch or weekly cron) — already-paid periods are skipped.
 */
export async function processWeeklyPayouts(): Promise<number> {
  const periodEnd = new Date();
  const defaultLookback = new Date(periodEnd.getTime() - 7 * 24 * 60 * 60 * 1000);

  const experts = await Expert.find({ isApproved: true });
  let processed = 0;

  for (const expert of experts) {
    if (!expert.bankDetails?.accountNumber) continue;

    // Never create another payout while one is still open
    const open = await Payout.findOne({
      expertId: expert._id,
      status: { $in: [PayoutStatus.PENDING, PayoutStatus.PROCESSING] },
    });
    if (open) continue;

    const lastPaid = await Payout.findOne({
      expertId: expert._id,
      status: PayoutStatus.COMPLETED,
    }).sort({ periodEnd: -1 });

    // Start strictly after the last paid window so calls aren't double-paid
    const periodStart = lastPaid?.periodEnd
      ? new Date(lastPaid.periodEnd.getTime() + 1)
      : defaultLookback;

    if (periodStart.getTime() >= periodEnd.getTime()) continue;

    const { grossAmount, commission, netAmount, callCount } = await calculateExpertEarnings(
      expert._id.toString(),
      periodStart,
      periodEnd
    );

    if (netAmount <= 0 || callCount === 0) continue;

    const payout = await Payout.create({
      expertId: expert._id,
      amount: grossAmount,
      commission,
      netAmount,
      periodStart,
      periodEnd,
      status: PayoutStatus.PROCESSING,
    });

    // Razorpay Payouts API integration placeholder
    // In production: call Razorpay X Payouts with expert.bankDetails
    payout.status = PayoutStatus.COMPLETED;
    payout.processedAt = new Date();
    await payout.save();

    await createNotification(
      expert.userId.toString(),
      "Payout processed",
      `Your payout of ₹${netAmount.toFixed(2)} has been processed`,
      NotificationType.PAYMENT,
      { payoutId: payout._id.toString() }
    );

    processed++;
  }

  return processed;
}

export async function getExpertPayouts(expertId: string, query: PaginationQuery) {
  return paginate({
    model: Payout,
    filter: { expertId },
    query,
    sort: { createdAt: -1 },
  });
}

export async function getAllPayouts(query: PaginationQuery) {
  return paginate({
    model: Payout,
    filter: {},
    query,
    populate: { path: "expertId", populate: { path: "userId", select: "name phone email" } },
    sort: { createdAt: -1 },
  });
}

export async function getExpertEarningsSummary(expertId: string) {
  const expert = await Expert.findById(expertId);
  if (!expert) return null;

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weeklyEarnings = await calculateExpertEarnings(expertId, weekAgo, new Date());

  const recentPayouts = await Payout.find({ expertId })
    .sort({ createdAt: -1 })
    .limit(5);

  const recentCalls = await Call.find({ expertId, status: CallStatus.COMPLETED })
    .sort({ endedAt: -1 })
    .limit(10)
    .populate("userId", "name avatar");

  return {
    totalEarnings: expert.totalEarnings,
    totalCalls: expert.totalCalls,
    totalMinutes: expert.totalMinutes,
    commissionPercent: expert.commissionPercent,
    weeklyEarnings,
    recentPayouts,
    recentCalls,
  };
}
