import Call from "../models/Call.js";
import Expert from "../models/Expert.js";
import User from "../models/User.js";
import {
  canAffordCall,
  calculateCallCost,
  debitWallet,
  getBalance,
  minutesRemaining,
} from "./wallet.service.js";
import { buildCallTokens, generateChannelName } from "./agora.service.js";
import { cacheSet, cacheGet, cacheDel, CacheKeys } from "./cache.service.js";
import { emitToUser } from "../config/socket.js";
import { CallStatus, ExpertStatus } from "../types/index.js";
import {
  NotFoundError,
  ForbiddenError,
  InsufficientBalanceError,
  ConflictError,
} from "../utils/AppError.js";
import { BILLING_INTERVAL_MS, LOW_BALANCE_WARNING_MINUTES } from "../utils/constants.js";
import type { ICall } from "../models/Call.js";

interface ActiveCallState {
  callId: string;
  userId: string;
  expertId: string;
  expertUserId: string;
  pricePerMinute: number;
  startedAt: string;
  elapsedSeconds: number;
  totalCost: number;
  billingTimer?: ReturnType<typeof setInterval>;
}

const activeBillingTimers = new Map<string, ReturnType<typeof setInterval>>();

export async function initiateCall(userId: string, expertId: string): Promise<{
  call: ICall;
  agoraToken: string;
  channelName: string;
}> {
  const expert = await Expert.findById(expertId).populate("userId", "name avatar");
  if (!expert || !expert.isApproved) {
    throw new NotFoundError("Expert");
  }
  if (expert.status !== ExpertStatus.ONLINE) {
    throw new ConflictError("Expert is not available");
  }

  const balance = await getBalance(userId);
  if (!canAffordCall(balance, expert.pricePerMinute)) {
    throw new InsufficientBalanceError("Insufficient balance to start a call");
  }

  const existingCall = await Call.findOne({
    userId,
    status: { $in: [CallStatus.RINGING, CallStatus.ACTIVE] },
  });
  if (existingCall) {
    throw new ConflictError("You already have an active call");
  }

  const expertUser = expert.userId as unknown as { _id: { toString(): string }; name: string; avatar: string };

  const call = await Call.create({
    userId,
    expertId,
    pricePerMinute: expert.pricePerMinute,
    status: CallStatus.RINGING,
  });

  const channelName = generateChannelName(call._id.toString());
  call.agoraChannelName = channelName;
  await call.save();

  expert.status = ExpertStatus.BUSY;
  await expert.save();

  const tokens = buildCallTokens(channelName, userId, expertUser._id.toString());

  emitToUser(expertUser._id.toString(), "call:incoming", {
    callId: call._id.toString(),
    callerName: (await User.findById(userId))?.name || "User",
    callerAvatar: (await User.findById(userId))?.avatar || "",
  });

  return {
    call,
    agoraToken: tokens.userToken,
    channelName,
  };
}

export async function acceptCall(callId: string, expertUserId: string): Promise<{
  call: ICall;
  agoraToken: string;
  channelName: string;
}> {
  const expert = await Expert.findOne({ userId: expertUserId });
  if (!expert) throw new ForbiddenError();

  const call = await Call.findById(callId);
  if (!call || call.expertId.toString() !== expert._id.toString()) {
    throw new NotFoundError("Call");
  }
  if (call.status !== CallStatus.RINGING) {
    throw new ConflictError("Call is no longer ringing");
  }

  call.status = CallStatus.ACTIVE;
  call.startedAt = new Date();
  await call.save();

  const channelName = call.agoraChannelName!;
  const tokens = buildCallTokens(channelName, call.userId.toString(), expertUserId);

  await cacheSet(CacheKeys.activeCall(callId), {
    callId,
    userId: call.userId.toString(),
    expertId: call.expertId.toString(),
    expertUserId,
    pricePerMinute: call.pricePerMinute,
    startedAt: call.startedAt.toISOString(),
    elapsedSeconds: 0,
    totalCost: 0,
  } satisfies ActiveCallState);

  startBillingTimer(callId);

  emitToUser(call.userId.toString(), "call:accepted", {
    callId,
    agoraToken: tokens.userToken,
    channelName,
  });

  return { call, agoraToken: tokens.expertToken, channelName };
}

export async function rejectCall(callId: string, expertUserId: string): Promise<ICall> {
  const expert = await Expert.findOne({ userId: expertUserId });
  if (!expert) throw new ForbiddenError();

  const call = await Call.findById(callId);
  if (!call || call.expertId.toString() !== expert._id.toString()) {
    throw new NotFoundError("Call");
  }

  call.status = CallStatus.REJECTED;
  call.endReason = "rejected";
  call.endedAt = new Date();
  await call.save();

  expert.status = ExpertStatus.ONLINE;
  await expert.save();

  emitToUser(call.userId.toString(), "call:rejected", { callId, reason: "Expert rejected the call" });

  return call;
}

function startBillingTimer(callId: string): void {
  if (activeBillingTimers.has(callId)) return;

  const timer = setInterval(async () => {
    try {
      const state = await cacheGet<ActiveCallState>(CacheKeys.activeCall(callId));
      if (!state) {
        stopBillingTimer(callId);
        return;
      }

      state.elapsedSeconds += 1;
      state.totalCost = calculateCallCost(state.pricePerMinute, state.elapsedSeconds);

      const balance = await getBalance(state.userId);
      const minsLeft = minutesRemaining(balance, state.pricePerMinute);

      emitToUser(state.userId, "call:timer", {
        callId,
        elapsed: state.elapsedSeconds,
        cost: state.totalCost,
        balance,
      });

      if (minsLeft <= LOW_BALANCE_WARNING_MINUTES && minsLeft > 0) {
        emitToUser(state.userId, "call:low-balance", {
          callId,
          balance,
          minutesRemaining: minsLeft,
        });
      }

      if (balance < calculateCallCost(state.pricePerMinute, 1)) {
        await endCall(callId, state.userId, "low_balance");
        return;
      }

      await cacheSet(CacheKeys.activeCall(callId), state);
    } catch (err) {
      console.error(`Billing timer error for call ${callId}:`, err);
    }
  }, BILLING_INTERVAL_MS);

  activeBillingTimers.set(callId, timer);
}

function stopBillingTimer(callId: string): void {
  const timer = activeBillingTimers.get(callId);
  if (timer) {
    clearInterval(timer);
    activeBillingTimers.delete(callId);
  }
}

export async function endCall(
  callId: string,
  endedByUserId: string,
  reason: "completed" | "low_balance" | "expert_ended" | "user_ended" | "force_ended" = "completed"
): Promise<ICall> {
  const call = await Call.findById(callId);
  if (!call) throw new NotFoundError("Call");

  if (call.status === CallStatus.COMPLETED || call.status === CallStatus.REJECTED || call.status === CallStatus.MISSED) {
    return call;
  }

  stopBillingTimer(callId);

  const state = await cacheGet<ActiveCallState>(CacheKeys.activeCall(callId));
  await cacheDel(CacheKeys.activeCall(callId));
  const durationSeconds = state?.elapsedSeconds ??
    (call.startedAt ? Math.floor((Date.now() - call.startedAt.getTime()) / 1000) : 0);

  const totalCost = calculateCallCost(call.pricePerMinute, durationSeconds);

  if (totalCost > 0 && call.status === CallStatus.ACTIVE) {
    await debitWallet(call.userId.toString(), totalCost, `Call with expert (${durationSeconds}s)`, {
      referenceId: callId,
      referenceType: "call",
    });

    const expert = await Expert.findById(call.expertId);
    if (expert) {
      const commission = (totalCost * expert.commissionPercent) / 100;
      const expertEarning = totalCost - commission;
      expert.totalEarnings += expertEarning;
      expert.totalCalls += 1;
      expert.totalMinutes += Math.ceil(durationSeconds / 60);
      expert.status = ExpertStatus.ONLINE;
      await expert.save();
    }
  } else if (call.status === CallStatus.RINGING) {
    const expert = await Expert.findById(call.expertId);
    if (expert) {
      expert.status = ExpertStatus.ONLINE;
      await expert.save();
    }
    if (reason === "completed") reason = "user_ended";
  }

  call.status = CallStatus.COMPLETED;
  call.endedAt = new Date();
  call.durationSeconds = durationSeconds;
  call.totalCost = totalCost;
  call.endReason = reason;
  await call.save();

  const expert = await Expert.findById(call.expertId);
  const expertUserId = expert ? (await User.findById(expert.userId))?.id : null;

  emitToUser(call.userId.toString(), "call:ended", {
    callId,
    duration: durationSeconds,
    cost: totalCost,
  });

  if (expertUserId) {
    emitToUser(expertUserId, "call:ended", {
      callId,
      duration: durationSeconds,
      cost: totalCost,
    });
  }

  return call;
}

export async function rateCall(
  callId: string,
  userId: string,
  rating: number,
  review?: string
): Promise<ICall> {
  const call = await Call.findOne({ _id: callId, userId, status: CallStatus.COMPLETED });
  if (!call) throw new NotFoundError("Call");
  if (call.rating) throw new ConflictError("Call already rated");

  call.rating = rating;
  call.review = review;
  await call.save();

  const expert = await Expert.findById(call.expertId);
  if (expert) {
    const newTotal = expert.totalRatings + 1;
    expert.rating = ((expert.rating * expert.totalRatings) + rating) / newTotal;
    expert.totalRatings = newTotal;
    await expert.save();
  }

  return call;
}

export async function getLiveCalls(): Promise<ICall[]> {
  return Call.find({ status: CallStatus.ACTIVE })
    .populate("userId", "name phone avatar")
    .populate({ path: "expertId", populate: { path: "userId", select: "name avatar" } })
    .sort({ startedAt: -1 });
}

export async function timeoutRingingCalls(): Promise<number> {
  const cutoff = new Date(Date.now() - 60 * 1000);
  const ringingCalls = await Call.find({
    status: CallStatus.RINGING,
    createdAt: { $lt: cutoff },
  });

  for (const call of ringingCalls) {
    call.status = CallStatus.MISSED;
    call.endReason = "missed";
    call.endedAt = new Date();
    await call.save();

    const expert = await Expert.findById(call.expertId);
    if (expert) {
      expert.status = ExpertStatus.ONLINE;
      await expert.save();
    }

    emitToUser(call.userId.toString(), "call:rejected", {
      callId: call._id.toString(),
      reason: "No answer",
    });
  }

  return ringingCalls.length;
}
