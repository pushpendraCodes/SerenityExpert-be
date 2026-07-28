import Call from "../models/Call.js";
import Expert from "../models/Expert.js";
import User from "../models/User.js";
import {
  canAffordCall,
  calculateCallCost,
  debitWallet,
  getBalance,
  minutesRemaining,
  splitFreeAndPaidSeconds,
} from "./wallet.service.js";
import { buildCallTokens, generateChannelName } from "./agora.service.js";
import { cacheSet, cacheGet, cacheDel, CacheKeys } from "./cache.service.js";
import { emitToUser } from "../config/socket.js";
import { createNotification } from "./notification.service.js";
import { CallStatus, ExpertStatus, NotificationType } from "../types/index.js";
import {
  NotFoundError,
  ForbiddenError,
  InsufficientBalanceError,
  ConflictError,
} from "../utils/AppError.js";
import { BILLING_INTERVAL_MS, CALL_RING_TIMEOUT_SECONDS, LOW_BALANCE_WARNING_MINUTES } from "../utils/constants.js";
import type { ICall } from "../models/Call.js";
import { uploadRecording } from "./cloudinary.service.js";

interface ActiveCallState {
  callId: string;
  userId: string;
  expertId: string;
  expertUserId: string;
  pricePerMinute: number;
  startedAt: string;
  elapsedSeconds: number;
  totalCost: number;
  freeSecondsRemainingAtStart: number;
  /** ISO timestamp updated every billing tick — used to detect dead timers after restart */
  updatedAt?: string;
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
  if (expert.userId.toString() === userId || (typeof expert.userId === "object" && (expert.userId as { _id?: unknown })._id?.toString() === userId)) {
    throw new ConflictError("You cannot call yourself");
  }
  if (expert.status !== ExpertStatus.ONLINE) {
    throw new ConflictError("Expert is not available");
  }

  const user = await User.findById(userId).select("walletBalance freeSecondsRemaining");
  const balance = user?.walletBalance ?? 0;
  const freeSeconds = user?.freeSecondsRemaining ?? 0;
  if (!canAffordCall(balance, expert.pricePerMinute, 60, freeSeconds)) {
    throw new InsufficientBalanceError("Insufficient balance to start a call");
  }

  const existingCall = await Call.findOne({
    userId,
    status: { $in: [CallStatus.RINGING, CallStatus.ACTIVE] },
  });
  if (existingCall) {
    // If a previous call is stuck (disconnect/error without a clean end), free the user
    // so they can place a new call immediately.
    const existingId = existingCall._id.toString();
    const liveState = await cacheGet<ActiveCallState>(CacheKeys.activeCall(existingId));
    const isStaleRinging =
      existingCall.status === CallStatus.RINGING &&
      Date.now() - new Date(existingCall.createdAt).getTime() > CALL_RING_TIMEOUT_SECONDS * 1000;
    const heartbeatAt = liveState?.updatedAt
      ? new Date(liveState.updatedAt).getTime()
      : liveState?.startedAt
        ? new Date(liveState.startedAt).getTime()
        : 0;
    const isStaleActive =
      existingCall.status === CallStatus.ACTIVE &&
      (!liveState || !heartbeatAt || Date.now() - heartbeatAt > 45_000);
    if (isStaleRinging || isStaleActive) {
      await endCall(existingId, userId, "force_ended");
    } else {
      throw new ConflictError("You already have an active call");
    }
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

  const caller = await User.findById(userId).select("+realName name avatar");
  const incomingPayload = {
    callId: call._id.toString(),
    callerName: caller?.realName || caller?.name || "User",
    callerAvatar: caller?.avatar || "",
    pricePerMinute: expert.pricePerMinute,
  };

  emitToUser(expertUser._id.toString(), "call:incoming", incomingPayload);

  // Push + in-app notification when expert is offline / tab closed
  await createNotification(
    expertUser._id.toString(),
    "Incoming consultation call",
    `${incomingPayload.callerName} is calling you`,
    NotificationType.CALL,
    {
      callId: call._id.toString(),
      type: "incoming_call",
      callerName: incomingPayload.callerName,
      callerAvatar: incomingPayload.callerAvatar || "",
      pricePerMinute: String(incomingPayload.pricePerMinute),
    }
  );

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

  const callerUser = await User.findById(call.userId).select("freeSecondsRemaining");
  const freeAtStart = callerUser?.freeSecondsRemaining ?? 0;

  await cacheSet(CacheKeys.activeCall(callId), {
    callId,
    userId: call.userId.toString(),
    expertId: call.expertId.toString(),
    expertUserId,
    pricePerMinute: call.pricePerMinute,
    startedAt: call.startedAt.toISOString(),
    elapsedSeconds: 0,
    totalCost: 0,
    freeSecondsRemainingAtStart: freeAtStart,
    updatedAt: new Date().toISOString(),
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
      const freeAtStart = state.freeSecondsRemainingAtStart ?? 0;
      const { paidSeconds } = splitFreeAndPaidSeconds(state.elapsedSeconds, freeAtStart);
      // User is charged only for paid seconds (free pool). Staff earnings use full duration.
      const userCost = calculateCallCost(state.pricePerMinute, paidSeconds);
      const grossCost = calculateCallCost(state.pricePerMinute, state.elapsedSeconds);
      state.totalCost = userCost;

      const walletBalance = await getBalance(state.userId);
      // Wallet is only debited when the call ends — remaining = wallet minus accrued paid cost
      const remainingBalance = Math.max(0, Math.round((walletBalance - userCost) * 100) / 100);
      const freeLeft = Math.max(0, freeAtStart - state.elapsedSeconds);
      const minsLeft =
        freeLeft > 0
          ? freeLeft / 60 + minutesRemaining(remainingBalance, state.pricePerMinute)
          : minutesRemaining(remainingBalance, state.pricePerMinute);
      const costPerSecond = calculateCallCost(state.pricePerMinute, 1);

      emitToUser(state.userId, "call:timer", {
        callId,
        elapsed: state.elapsedSeconds,
        cost: userCost,
        balance: remainingBalance,
      });
      emitToUser(state.expertUserId, "call:timer", {
        callId,
        elapsed: state.elapsedSeconds,
        cost: grossCost,
        balance: remainingBalance,
        pricePerMinute: state.pricePerMinute,
      });

      if (freeLeft <= 0 && minsLeft <= LOW_BALANCE_WARNING_MINUTES && remainingBalance > 0) {
        console.log(
          `⚠️ Low balance warning for call ${callId}: balance=${remainingBalance}, minsLeft=${minsLeft}`
        );
        emitToUser(state.userId, "call:low-balance", {
          callId,
          balance: remainingBalance,
          minutesRemaining: minsLeft,
        });
      }

      // Auto-cut once free seconds exhausted and remaining balance can't cover another second
      if (freeLeft <= 0 && remainingBalance < costPerSecond) {
        console.log(
          `✂️ Auto-ending call ${callId} for low balance: balance=${remainingBalance}, costPerSecond=${costPerSecond}`
        );
        await endCall(callId, state.userId, "low_balance");
        return;
      }

      state.updatedAt = new Date().toISOString();
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

  const caller = await User.findById(call.userId).select("freeSecondsRemaining walletBalance");
  const freePool =
    state?.freeSecondsRemainingAtStart !== undefined
      ? state.freeSecondsRemainingAtStart
      : caller?.freeSecondsRemaining ?? 0;
  const { freeSecondsUsed, paidSeconds, freeSecondsLeft } = splitFreeAndPaidSeconds(
    durationSeconds,
    freePool
  );
  // User wallet: only paid seconds. Staff earnings / call.totalCost: full duration (platform covers free time).
  const userCharge = calculateCallCost(call.pricePerMinute, paidSeconds);
  const grossCost = calculateCallCost(call.pricePerMinute, durationSeconds);

  if (caller && freeSecondsUsed > 0) {
    caller.freeSecondsRemaining = freeSecondsLeft;
    await caller.save();
  }

  if (call.status === CallStatus.ACTIVE) {
    if (userCharge > 0) {
      const walletBalance = await getBalance(call.userId.toString());
      const debitAmount = Math.min(userCharge, walletBalance);
      try {
        if (debitAmount > 0) {
          await debitWallet(
            call.userId.toString(),
            debitAmount,
            `Call with staff (${durationSeconds}s, ${freeSecondsUsed}s free)`,
            {
              referenceId: callId,
              referenceType: "call",
            }
          );
        }
      } catch (err) {
        console.error(`Failed to debit wallet for call ${callId}:`, err);
      }
    }

    const expert = await Expert.findById(call.expertId);
    if (expert) {
      const commission = (grossCost * expert.commissionPercent) / 100;
      const expertEarning = grossCost - commission;
      expert.totalEarnings += expertEarning;
      expert.totalCalls += 1;
      expert.totalMinutes += Math.ceil(durationSeconds / 60);
      expert.status = ExpertStatus.ONLINE;
      await expert.save();
    }
    call.status = CallStatus.COMPLETED;
  } else if (call.status === CallStatus.RINGING) {
    const expert = await Expert.findById(call.expertId);
    if (expert) {
      expert.status = ExpertStatus.ONLINE;
      await expert.save();
    }
    call.status = CallStatus.MISSED;
    if (reason === "completed") reason = "user_ended";
  } else {
    call.status = CallStatus.COMPLETED;
    const expert = await Expert.findById(call.expertId);
    if (expert && expert.status === ExpertStatus.BUSY) {
      expert.status = ExpertStatus.ONLINE;
      await expert.save();
    }
  }

  call.endedAt = new Date();
  call.durationSeconds = durationSeconds;
  call.freeSecondsUsed = freeSecondsUsed;
  call.totalCost = grossCost;
  call.endReason = reason;
  await call.save();

  const expertDoc = await Expert.findById(call.expertId);
  const expertUserId = expertDoc?.userId?.toString() || null;

  const baseEnded = {
    callId,
    duration: durationSeconds,
    status: call.status,
    endReason: reason,
    recordingUrl: call.recordingUrl,
  };

  emitToUser(call.userId.toString(), "call:ended", {
    ...baseEnded,
    cost: userCharge,
  });

  if (expertUserId) {
    emitToUser(expertUserId, "call:ended", {
      ...baseEnded,
      cost: grossCost,
    });
    emitToUser(expertUserId, "call:cancelled", { callId, reason: call.status });
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
      const expertUserId = expert.userId.toString();
      emitToUser(expertUserId, "call:cancelled", {
        callId: call._id.toString(),
        reason: "missed",
      });
      await createNotification(
        expertUserId,
        "Missed consultation",
        "A user tried to call you but the call timed out",
        NotificationType.CALL,
        { callId: call._id.toString(), type: "missed_call" }
      );
    }

    emitToUser(call.userId.toString(), "call:rejected", {
      callId: call._id.toString(),
      reason: "No answer",
    });
  }

  return ringingCalls.length;
}

/**
 * Force-complete ACTIVE calls whose Redis billing state is gone, or whose
 * billing heartbeat stopped (e.g. server restart). Frees the user to call again.
 */
export async function timeoutStaleActiveCalls(): Promise<number> {
  const STALE_HEARTBEAT_MS = 45_000;
  const GRACE_MS = 15_000;
  const activeCalls = await Call.find({ status: CallStatus.ACTIVE });
  let closed = 0;

  for (const call of activeCalls) {
    const callId = call._id.toString();
    const state = await cacheGet<ActiveCallState>(CacheKeys.activeCall(callId));
    const startedAt = call.startedAt ? new Date(call.startedAt).getTime() : 0;
    if (startedAt && Date.now() - startedAt < GRACE_MS) continue;

    const heartbeatAt = state?.updatedAt
      ? new Date(state.updatedAt).getTime()
      : state?.startedAt
        ? new Date(state.startedAt).getTime()
        : 0;
    const isStale = !state || !heartbeatAt || Date.now() - heartbeatAt > STALE_HEARTBEAT_MS;
    if (!isStale) continue;

    await endCall(callId, call.userId.toString(), "force_ended");
    closed += 1;
  }

  return closed;
}

export async function saveCallRecording(
  callId: string,
  userId: string,
  buffer: Buffer
): Promise<ICall> {
  const call = await Call.findById(callId);
  if (!call) throw new NotFoundError("Call");

  const expert = await Expert.findOne({ userId });
  const isCaller = call.userId.toString() === userId;
  const isExpert = expert && call.expertId.toString() === expert._id.toString();
  if (!isCaller && !isExpert) throw new ForbiddenError();

  if (call.recordingUrl) return call;

  const uploaded = await uploadRecording(buffer, callId);
  call.recordingUrl = uploaded.url;
  await call.save();

  emitToUser(call.userId.toString(), "call:recording-ready", {
    callId,
    recordingUrl: uploaded.url,
  });
  if (expert) {
    emitToUser(expert.userId.toString(), "call:recording-ready", {
      callId,
      recordingUrl: uploaded.url,
    });
  }

  return call;
}
