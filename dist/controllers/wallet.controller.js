"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTransactions = exports.webhook = exports.verifyPayment = exports.createRecharge = void 0;
const razorpayService = __importStar(require("../services/razorpay.service.js"));
const response_js_1 = require("../utils/response.js");
const asyncHandler_js_1 = require("../utils/asyncHandler.js");
const pagination_js_1 = require("../utils/pagination.js");
const Transaction_js_1 = __importDefault(require("../models/Transaction.js"));
exports.createRecharge = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const { amount, couponCode } = req.body;
    const order = await razorpayService.createRechargeOrder(req.user._id.toString(), amount, couponCode);
    return (0, response_js_1.sendSuccess)(res, order, "Recharge order created");
});
exports.verifyPayment = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    const result = await razorpayService.processPaymentVerification(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    return (0, response_js_1.sendSuccess)(res, result, "Payment verified and wallet credited");
});
exports.webhook = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const signature = req.headers["x-razorpay-signature"];
    const rawBody = JSON.stringify(req.body);
    if (signature && !razorpayService.verifyWebhookSignature(rawBody, signature)) {
        return res.status(400).json({ success: false, message: "Invalid webhook signature" });
    }
    await razorpayService.handleWebhook(req.body);
    return res.status(200).json({ success: true });
});
exports.getTransactions = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const result = await (0, pagination_js_1.paginate)({
        model: Transaction_js_1.default,
        filter: { userId: req.user._id },
        query: req.query,
        sort: { createdAt: -1 },
    });
    return (0, response_js_1.sendPaginated)(res, result);
});
//# sourceMappingURL=wallet.controller.js.map