import mongoose, { Schema, Document, Types } from "mongoose";
import { RechargeStatus } from "../types/index.js";

export interface IRecharge extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  amount: number;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  status: RechargeStatus;
  couponCode?: string;
  discountAmount?: number;
  createdAt: Date;
}

const rechargeSchema = new Schema<IRecharge>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
    },
    razorpayPaymentId: String,
    razorpaySignature: String,
    status: {
      type: String,
      enum: Object.values(RechargeStatus),
      default: RechargeStatus.CREATED,
    },
    couponCode: String,
    discountAmount: {
      type: Number,
      default: 0,
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

rechargeSchema.index({ userId: 1, createdAt: -1 });

const Recharge = mongoose.model<IRecharge>("Recharge", rechargeSchema);
export default Recharge;
