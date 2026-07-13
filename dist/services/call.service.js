"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initiateCall = initiateCall;
exports.acceptCall = acceptCall;
exports.rejectCall = rejectCall;
exports.endCall = endCall;
exports.rateCall = rateCall;
exports.getLiveCalls = getLiveCalls;
exports.timeoutRingingCalls = timeoutRingingCalls;
const Call_js_1 = __importDefault(require("../models/Call.js"));
const Expert_js_1 = __importDefault(require("../models/Expert.js"));
const User_js_1 = __importDefault(require("../models/User.js"));
const wallet_service_js_1 = require("./wallet.service.js");
const agora_service_js_1 = require("./agora.service.js");
const cache_service_js_1 = require("./cache.service.js");
const socket_js_1 = require("../config/socket.js");
const index_js_1 = require("../types/index.js");
const AppError_js_1 = require("../utils/AppError.js");
const constants_js_1 = require("../utils/constants.js");
const activeBillingTimers = new Map();
async function initiateCall(userId, expertId) {
    const expert = await Expert_js_1.default.findById(expertId).populate("userId", "name avatar");
    if (!expert || !expert.isApproved) {
        throw new AppError_js_1.NotFoundError("Expert");
    }
    if (expert.status !== index_js_1.ExpertStatus.ONLINE) {
        throw new AppError_js_1.ConflictError("Expert is not available");
    }
    const balance = await (0, wallet_service_js_1.getBalance)(userId);
    if (!(0, wallet_service_js_1.canAffordCall)(balance, expert.pricePerMinute)) {
        throw new AppError_js_1.InsufficientBalanceError("Insufficient balance to start a call");
    }
    const existingCall = await Call_js_1.default.findOne({
        userId,
        status: { $in: [index_js_1.CallStatus.RINGING, index_js_1.CallStatus.ACTIVE] },
    });
    if (existingCall) {
        throw new AppError_js_1.ConflictError("You already have an active call");
    }
    const expertUser = expert.userId;
    const call = await Call_js_1.default.create({
        userId,
        expertId,
        pricePerMinute: expert.pricePerMinute,
        status: index_js_1.CallStatus.RINGING,
    });
    const channelName = (0, agora_service_js_1.generateChannelName)(call._id.toString());
    call.agoraChannelName = channelName;
    await call.save();
    expert.status = index_js_1.ExpertStatus.BUSY;
    await expert.save();
    const tokens = (0, agora_service_js_1.buildCallTokens)(channelName, userId, expertUser._id.toString());
    (0, socket_js_1.emitToUser)(expertUser._id.toString(), "call:incoming", {
        callId: call._id.toString(),
        callerName: (await User_js_1.default.findById(userId))?.name || "User",
        callerAvatar: (await User_js_1.default.findById(userId))?.avatar || "",
    });
    return {
        call,
        agoraToken: tokens.userToken,
        channelName,
    };
}
async function acceptCall(callId, expertUserId) {
    const expert = await Expert_js_1.default.findOne({ userId: expertUserId });
    if (!expert)
        throw new AppError_js_1.ForbiddenError();
    const call = await Call_js_1.default.findById(callId);
    if (!call || call.expertId.toString() !== expert._id.toString()) {
        throw new AppError_js_1.NotFoundError("Call");
    }
    if (call.status !== index_js_1.CallStatus.RINGING) {
        throw new AppError_js_1.ConflictError("Call is no longer ringing");
    }
    call.status = index_js_1.CallStatus.ACTIVE;
    call.startedAt = new Date();
    await call.save();
    const channelName = call.agoraChannelName;
    const tokens = (0, agora_service_js_1.buildCallTokens)(channelName, call.userId.toString(), expertUserId);
    await (0, cache_service_js_1.cacheSet)(cache_service_js_1.CacheKeys.activeCall(callId), {
        callId,
        userId: call.userId.toString(),
        expertId: call.expertId.toString(),
        expertUserId,
        pricePerMinute: call.pricePerMinute,
        startedAt: call.startedAt.toISOString(),
        elapsedSeconds: 0,
        totalCost: 0,
    });
    startBillingTimer(callId);
    (0, socket_js_1.emitToUser)(call.userId.toString(), "call:accepted", {
        callId,
        agoraToken: tokens.userToken,
        channelName,
    });
    return { call, agoraToken: tokens.expertToken, channelName };
}
async function rejectCall(callId, expertUserId) {
    const expert = await Expert_js_1.default.findOne({ userId: expertUserId });
    if (!expert)
        throw new AppError_js_1.ForbiddenError();
    const call = await Call_js_1.default.findById(callId);
    if (!call || call.expertId.toString() !== expert._id.toString()) {
        throw new AppError_js_1.NotFoundError("Call");
    }
    call.status = index_js_1.CallStatus.REJECTED;
    call.endReason = "rejected";
    call.endedAt = new Date();
    await call.save();
    expert.status = index_js_1.ExpertStatus.ONLINE;
    await expert.save();
    (0, socket_js_1.emitToUser)(call.userId.toString(), "call:rejected", { callId, reason: "Expert rejected the call" });
    return call;
}
function startBillingTimer(callId) {
    if (activeBillingTimers.has(callId))
        return;
    const timer = setInterval(async () => {
        try {
            const state = await (0, cache_service_js_1.cacheGet)(cache_service_js_1.CacheKeys.activeCall(callId));
            if (!state) {
                stopBillingTimer(callId);
                return;
            }
            state.elapsedSeconds += 1;
            state.totalCost = (0, wallet_service_js_1.calculateCallCost)(state.pricePerMinute, state.elapsedSeconds);
            const balance = await (0, wallet_service_js_1.getBalance)(state.userId);
            const minsLeft = (0, wallet_service_js_1.minutesRemaining)(balance, state.pricePerMinute);
            (0, socket_js_1.emitToUser)(state.userId, "call:timer", {
                callId,
                elapsed: state.elapsedSeconds,
                cost: state.totalCost,
                balance,
            });
            if (minsLeft <= constants_js_1.LOW_BALANCE_WARNING_MINUTES && minsLeft > 0) {
                (0, socket_js_1.emitToUser)(state.userId, "call:low-balance", {
                    callId,
                    balance,
                    minutesRemaining: minsLeft,
                });
            }
            if (balance < (0, wallet_service_js_1.calculateCallCost)(state.pricePerMinute, 1)) {
                await endCall(callId, state.userId, "low_balance");
                return;
            }
            await (0, cache_service_js_1.cacheSet)(cache_service_js_1.CacheKeys.activeCall(callId), state);
        }
        catch (err) {
            console.error(`Billing timer error for call ${callId}:`, err);
        }
    }, constants_js_1.BILLING_INTERVAL_MS);
    activeBillingTimers.set(callId, timer);
}
function stopBillingTimer(callId) {
    const timer = activeBillingTimers.get(callId);
    if (timer) {
        clearInterval(timer);
        activeBillingTimers.delete(callId);
    }
}
async function endCall(callId, endedByUserId, reason = "completed") {
    const call = await Call_js_1.default.findById(callId);
    if (!call)
        throw new AppError_js_1.NotFoundError("Call");
    if (call.status === index_js_1.CallStatus.COMPLETED || call.status === index_js_1.CallStatus.REJECTED || call.status === index_js_1.CallStatus.MISSED) {
        return call;
    }
    stopBillingTimer(callId);
    const state = await (0, cache_service_js_1.cacheGet)(cache_service_js_1.CacheKeys.activeCall(callId));
    await (0, cache_service_js_1.cacheDel)(cache_service_js_1.CacheKeys.activeCall(callId));
    const durationSeconds = state?.elapsedSeconds ??
        (call.startedAt ? Math.floor((Date.now() - call.startedAt.getTime()) / 1000) : 0);
    const totalCost = (0, wallet_service_js_1.calculateCallCost)(call.pricePerMinute, durationSeconds);
    if (totalCost > 0 && call.status === index_js_1.CallStatus.ACTIVE) {
        await (0, wallet_service_js_1.debitWallet)(call.userId.toString(), totalCost, `Call with expert (${durationSeconds}s)`, {
            referenceId: callId,
            referenceType: "call",
        });
        const expert = await Expert_js_1.default.findById(call.expertId);
        if (expert) {
            const commission = (totalCost * expert.commissionPercent) / 100;
            const expertEarning = totalCost - commission;
            expert.totalEarnings += expertEarning;
            expert.totalCalls += 1;
            expert.totalMinutes += Math.ceil(durationSeconds / 60);
            expert.status = index_js_1.ExpertStatus.ONLINE;
            await expert.save();
        }
    }
    else if (call.status === index_js_1.CallStatus.RINGING) {
        const expert = await Expert_js_1.default.findById(call.expertId);
        if (expert) {
            expert.status = index_js_1.ExpertStatus.ONLINE;
            await expert.save();
        }
        if (reason === "completed")
            reason = "user_ended";
    }
    call.status = index_js_1.CallStatus.COMPLETED;
    call.endedAt = new Date();
    call.durationSeconds = durationSeconds;
    call.totalCost = totalCost;
    call.endReason = reason;
    await call.save();
    const expert = await Expert_js_1.default.findById(call.expertId);
    const expertUserId = expert ? (await User_js_1.default.findById(expert.userId))?.id : null;
    (0, socket_js_1.emitToUser)(call.userId.toString(), "call:ended", {
        callId,
        duration: durationSeconds,
        cost: totalCost,
    });
    if (expertUserId) {
        (0, socket_js_1.emitToUser)(expertUserId, "call:ended", {
            callId,
            duration: durationSeconds,
            cost: totalCost,
        });
    }
    return call;
}
async function rateCall(callId, userId, rating, review) {
    const call = await Call_js_1.default.findOne({ _id: callId, userId, status: index_js_1.CallStatus.COMPLETED });
    if (!call)
        throw new AppError_js_1.NotFoundError("Call");
    if (call.rating)
        throw new AppError_js_1.ConflictError("Call already rated");
    call.rating = rating;
    call.review = review;
    await call.save();
    const expert = await Expert_js_1.default.findById(call.expertId);
    if (expert) {
        const newTotal = expert.totalRatings + 1;
        expert.rating = ((expert.rating * expert.totalRatings) + rating) / newTotal;
        expert.totalRatings = newTotal;
        await expert.save();
    }
    return call;
}
async function getLiveCalls() {
    return Call_js_1.default.find({ status: index_js_1.CallStatus.ACTIVE })
        .populate("userId", "name phone avatar")
        .populate({ path: "expertId", populate: { path: "userId", select: "name avatar" } })
        .sort({ startedAt: -1 });
}
async function timeoutRingingCalls() {
    const cutoff = new Date(Date.now() - 60 * 1000);
    const ringingCalls = await Call_js_1.default.find({
        status: index_js_1.CallStatus.RINGING,
        createdAt: { $lt: cutoff },
    });
    for (const call of ringingCalls) {
        call.status = index_js_1.CallStatus.MISSED;
        call.endReason = "missed";
        call.endedAt = new Date();
        await call.save();
        const expert = await Expert_js_1.default.findById(call.expertId);
        if (expert) {
            expert.status = index_js_1.ExpertStatus.ONLINE;
            await expert.save();
        }
        (0, socket_js_1.emitToUser)(call.userId.toString(), "call:rejected", {
            callId: call._id.toString(),
            reason: "No answer",
        });
    }
    return ringingCalls.length;
}
//# sourceMappingURL=call.service.js.map