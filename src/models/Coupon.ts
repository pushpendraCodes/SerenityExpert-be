import mongoose, { Schema, Document, Types } from "mongoose";
import { DiscountType } from "../types/index.js";

export interface ICoupon extends Document {
  _id: Types.ObjectId;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minAmount: number;
  maxDiscount?: number;
  usageLimit: number;
  usedCount: number;
  validFrom: Date;
  validTo: Date;
  isActive: boolean;
  createdAt: Date;
}

const couponSchema = new Schema<ICoupon>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    discountType: {
      type: String,
      enum: Object.values(DiscountType),
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
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        Reflect.deleteProperty(ret, "__v");
        return ret;
      },
    },
  }
);

couponSchema.index({ code: 1 });
couponSchema.index({ isActive: 1, validFrom: 1, validTo: 1 });

const Coupon = mongoose.model<ICoupon>("Coupon", couponSchema);
export default Coupon;
