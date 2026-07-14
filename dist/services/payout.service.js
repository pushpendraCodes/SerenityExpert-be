"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateExpertEarnings = calculateExpertEarnings;
exports.createPayoutRequest = createPayoutRequest;
exports.processWeeklyPayouts = processWeeklyPayouts;
exports.getExpertPayouts = getExpertPayouts;
exports.getAllPayouts = getAllPayouts;
exports.getExpertEarningsSummary = getExpertEarningsSummary;
const Call_js_1 = __importDefault(require("../models/Call.js"));
const Expert_js_1 = __importDefault(require("../models/Expert.js"));
const Payout_js_1 = __importDefault(require("../models/Payout.js"));
const index_js_1 = require("../types/index.js");
const pagination_js_1 = require("../utils/pagination.js");
const notification_service_js_1 = require("./notification.service.js");
const index_js_2 = require("../types/index.js");
async function calculateExpertEarnings(expertId, periodStart, periodEnd) {
    const expert = await Expert_js_1.default.findById(expertId);
    if (!expert)
        return { grossAmount: 0, commission: 0, netAmount: 0, callCount: 0 };
    const calls = await Call_js_1.default.find({
        expertId,
        status: index_js_1.CallStatus.COMPLETED,
        endedAt: { $gte: periodStart, $lte: periodEnd },
    });
    const grossAmount = calls.reduce((sum, call) => sum + call.totalCost, 0);
    const commission = (grossAmount * expert.commissionPercent) / 100;
    const netAmount = grossAmount - commission;
    return { grossAmount, commission, netAmount, callCount: calls.length };
}
async function createPayoutRequest(expertId) {
    const expert = await Expert_js_1.default.findById(expertId);
    if (!expert)
        throw new Error("Expert not found");
    const pendingPayout = await Payout_js_1.default.findOne({
        expertId,
        status: { $in: [index_js_1.PayoutStatus.PENDING, index_js_1.PayoutStatus.PROCESSING] },
    });
    if (pendingPayout) {
        throw new Error("A payout request is already pending");
    }
    const periodEnd = new Date();
    const lastPayout = await Payout_js_1.default.findOne({ expertId, status: index_js_1.PayoutStatus.COMPLETED }).sort({ periodEnd: -1 });
    const periodStart = lastPayout?.periodEnd || new Date(periodEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
    const { grossAmount, commission, netAmount } = await calculateExpertEarnings(expertId, periodStart, periodEnd);
    if (netAmount <= 0) {
        throw new Error("No earnings available for payout");
    }
    return Payout_js_1.default.create({
        expertId,
        amount: grossAmount,
        commission,
        netAmount,
        periodStart,
        periodEnd,
        status: index_js_1.PayoutStatus.PENDING,
    });
}
async function processWeeklyPayouts() {
    const periodEnd = new Date();
    const periodStart = new Date(periodEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
    const experts = await Expert_js_1.default.find({ isApproved: true, totalEarnings: { $gt: 0 } });
    let processed = 0;
    for (const expert of experts) {
        const existing = await Payout_js_1.default.findOne({
            expertId: expert._id,
            periodStart: { $gte: periodStart },
            periodEnd: { $lte: periodEnd },
        });
        if (existing)
            continue;
        const { grossAmount, commission, netAmount, callCount } = await calculateExpertEarnings(expert._id.toString(), periodStart, periodEnd);
        if (netAmount <= 0 || callCount === 0)
            continue;
        const payout = await Payout_js_1.default.create({
            expertId: expert._id,
            amount: grossAmount,
            commission,
            netAmount,
            periodStart,
            periodEnd,
            status: index_js_1.PayoutStatus.PROCESSING,
        });
        // Razorpay Payouts API integration placeholder
        // In production: call Razorpay X Payouts with expert.bankDetails
        payout.status = index_js_1.PayoutStatus.COMPLETED;
        payout.processedAt = new Date();
        await payout.save();
        await (0, notification_service_js_1.createNotification)(expert.userId.toString(), "Payout processed", `Your payout of ₹${netAmount.toFixed(2)} has been processed`, index_js_2.NotificationType.PAYMENT, { payoutId: payout._id.toString() });
        processed++;
    }
    return processed;
}
async function getExpertPayouts(expertId, query) {
    return (0, pagination_js_1.paginate)({
        model: Payout_js_1.default,
        filter: { expertId },
        query,
        sort: { createdAt: -1 },
    });
}
async function getAllPayouts(query) {
    return (0, pagination_js_1.paginate)({
        model: Payout_js_1.default,
        filter: {},
        query,
        populate: { path: "expertId", populate: { path: "userId", select: "name phone email" } },
        sort: { createdAt: -1 },
    });
}
async function getExpertEarningsSummary(expertId) {
    const expert = await Expert_js_1.default.findById(expertId);
    if (!expert)
        return null;
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklyEarnings = await calculateExpertEarnings(expertId, weekAgo, new Date());
    const recentPayouts = await Payout_js_1.default.find({ expertId })
        .sort({ createdAt: -1 })
        .limit(5);
    const recentCalls = await Call_js_1.default.find({ expertId, status: index_js_1.CallStatus.COMPLETED })
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
//# sourceMappingURL=payout.service.js.map