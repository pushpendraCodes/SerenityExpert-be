"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBalance = getBalance;
exports.creditWallet = creditWallet;
exports.debitWallet = debitWallet;
exports.adjustWallet = adjustWallet;
exports.calculateCallCost = calculateCallCost;
exports.canAffordCall = canAffordCall;
exports.minutesRemaining = minutesRemaining;
const mongoose_1 = __importDefault(require("mongoose"));
const User_js_1 = __importDefault(require("../models/User.js"));
const Transaction_js_1 = __importDefault(require("../models/Transaction.js"));
const index_js_1 = require("../types/index.js");
const AppError_js_1 = require("../utils/AppError.js");
async function getBalance(userId) {
    const user = await User_js_1.default.findById(userId).select("walletBalance");
    return user?.walletBalance ?? 0;
}
async function creditWallet(userId, amount, description, meta = {}) {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const user = await User_js_1.default.findById(userId).session(session);
        if (!user)
            throw new Error("User not found");
        const balanceBefore = user.walletBalance;
        const balanceAfter = balanceBefore + amount;
        user.walletBalance = balanceAfter;
        await user.save({ session });
        const [transaction] = await Transaction_js_1.default.create([{
                userId,
                type: meta.type || index_js_1.TransactionType.RECHARGE,
                amount,
                balanceBefore,
                balanceAfter,
                referenceId: meta.referenceId,
                referenceType: meta.referenceType,
                razorpayPaymentId: meta.razorpayPaymentId,
                razorpayOrderId: meta.razorpayOrderId,
                description,
                status: index_js_1.TransactionStatus.COMPLETED,
            }], { session });
        await session.commitTransaction();
        return { balanceAfter, transactionId: transaction._id.toString() };
    }
    catch (err) {
        await session.abortTransaction();
        throw err;
    }
    finally {
        session.endSession();
    }
}
async function debitWallet(userId, amount, description, meta = {}) {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const user = await User_js_1.default.findById(userId).session(session);
        if (!user)
            throw new Error("User not found");
        if (user.walletBalance < amount) {
            throw new AppError_js_1.InsufficientBalanceError();
        }
        const balanceBefore = user.walletBalance;
        const balanceAfter = balanceBefore - amount;
        user.walletBalance = balanceAfter;
        await user.save({ session });
        const [transaction] = await Transaction_js_1.default.create([{
                userId,
                type: index_js_1.TransactionType.DEDUCTION,
                amount,
                balanceBefore,
                balanceAfter,
                referenceId: meta.referenceId,
                referenceType: meta.referenceType,
                description,
                status: index_js_1.TransactionStatus.COMPLETED,
            }], { session });
        await session.commitTransaction();
        return { balanceAfter, transactionId: transaction._id.toString() };
    }
    catch (err) {
        await session.abortTransaction();
        throw err;
    }
    finally {
        session.endSession();
    }
}
async function adjustWallet(userId, amount, type, description, adminId) {
    if (type === "credit") {
        const result = await creditWallet(userId, amount, description, {
            referenceType: "adjustment",
            referenceId: adminId,
            type: index_js_1.TransactionType.ADJUSTMENT,
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
function calculateCallCost(pricePerMinute, durationSeconds) {
    const costPerSecond = pricePerMinute / 60;
    return Math.ceil(costPerSecond * durationSeconds * 100) / 100;
}
function canAffordCall(balance, pricePerMinute, minSeconds = 60) {
    const minCost = calculateCallCost(pricePerMinute, minSeconds);
    return balance >= minCost;
}
function minutesRemaining(balance, pricePerMinute) {
    if (pricePerMinute <= 0)
        return Infinity;
    return Math.floor((balance / pricePerMinute) * 60) / 60;
}
//# sourceMappingURL=wallet.service.js.map