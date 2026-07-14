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
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const index_js_1 = require("../types/index.js");
const availabilitySlotSchema = new mongoose_1.Schema({
    day: {
        type: String,
        enum: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
        required: true,
    },
    startTime: { type: String, required: true }, // HH:mm
    endTime: { type: String, required: true },
}, { _id: false });
const bankDetailsSchema = new mongoose_1.Schema({
    accountName: { type: String, trim: true },
    accountNumber: { type: String, trim: true },
    ifscCode: { type: String, trim: true },
    bankName: { type: String, trim: true },
    upiId: { type: String, trim: true },
}, { _id: false });
const expertSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
        index: true,
    },
    mobile: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true,
    },
    bio: {
        type: String,
        default: "",
        maxlength: 1000,
    },
    experience: {
        type: Number,
        default: 0,
        min: 0,
    },
    categories: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "Category",
        }],
    languages: {
        type: [String],
        default: ["English"],
    },
    pricePerMinute: {
        type: Number,
        required: true,
        min: 0,
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
    },
    totalRatings: {
        type: Number,
        default: 0,
    },
    totalCalls: {
        type: Number,
        default: 0,
    },
    totalMinutes: {
        type: Number,
        default: 0,
    },
    totalEarnings: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: Object.values(index_js_1.ExpertStatus),
        default: index_js_1.ExpertStatus.OFFLINE,
    },
    availabilitySchedule: {
        type: [availabilitySlotSchema],
        default: [],
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    isApproved: {
        type: Boolean,
        default: false,
    },
    rejectionReason: String,
    bankDetails: {
        type: bankDetailsSchema,
    },
    commissionPercent: {
        type: Number,
        default: 20, // Default 20% platform commission
        min: 0,
        max: 100,
    },
}, {
    timestamps: true,
    toJSON: {
        transform(_doc, ret) {
            Reflect.deleteProperty(ret, "__v");
            return ret;
        },
    },
});
// Indexes
expertSchema.index({ categories: 1 });
expertSchema.index({ status: 1 });
expertSchema.index({ isApproved: 1 });
expertSchema.index({ rating: -1 });
expertSchema.index({ pricePerMinute: 1 });
const Expert = mongoose_1.default.model("Expert", expertSchema);
exports.default = Expert;
//# sourceMappingURL=Expert.js.map