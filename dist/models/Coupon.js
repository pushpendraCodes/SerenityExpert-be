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
const couponSchema = new mongoose_1.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
    },
    discountType: {
        type: String,
        enum: Object.values(index_js_1.DiscountType),
        required: true,
    },
    discountValue: {
        type: Number,
        required: true,
        min: 0,
    },
    minAmount: {
        type: Number,
        default: 0,
        min: 0,
    },
    maxDiscount: {
        type: Number,
        min: 0,
    },
    usageLimit: {
        type: Number,
        default: 0, // 0 = unlimited
    },
    usedCount: {
        type: Number,
        default: 0,
    },
    validFrom: {
        type: Date,
        required: true,
    },
    validTo: {
        type: Date,
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
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
couponSchema.index({ code: 1 });
couponSchema.index({ isActive: 1, validFrom: 1, validTo: 1 });
const Coupon = mongoose_1.default.model("Coupon", couponSchema);
exports.default = Coupon;
//# sourceMappingURL=Coupon.js.map