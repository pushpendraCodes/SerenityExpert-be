"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRazorpay = void 0;
const razorpay_1 = __importDefault(require("razorpay"));
let razorpayInstance;
const getRazorpay = () => {
    if (!razorpayInstance) {
        razorpayInstance = new razorpay_1.default({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
        console.log("✅ Razorpay initialized");
    }
    return razorpayInstance;
};
exports.getRazorpay = getRazorpay;
exports.default = exports.getRazorpay;
//# sourceMappingURL=razorpay.js.map