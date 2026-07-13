import mongoose, { Schema, Document, Types } from "mongoose";
import { PayoutStatus } from "../types/index.js";

export interface IPayout extends Document {
  _id: Types.ObjectId;
  expertId: Types.ObjectId;
  amount: number;
  commission: number;
  netAmount: number;
  periodStart: Date;
  periodEnd: Date;
  status: PayoutStatus;
  razorpayPayoutId?: string;
  transactionRef?: string;
  processedAt?: Date;
  notes?: string;
  createdAt: Date;
}

const payoutSchema = new Schema<IPayout>(
  {
    expertId: {
      type: Schema.Types.ObjectId,
      ref: "Expert",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    commission: {
      type: Number,
      required: true,
      min: 0,
    },
    netAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    periodStart: {
      type: Date,
      required: true,
    },
    periodEnd: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(PayoutStatus),
      default: PayoutStatus.PENDING,
    },
    razorpayPayoutId: String,
    transactionRef: String,
    processedAt: Date,
    notes: String,
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

payoutSchema.index({ status: 1, createdAt: -1 });
payoutSchema.index({ expertId: 1, periodStart: 1, periodEnd: 1 });

const Payout = mongoose.model<IPayout>("Payout", payoutSchema);
export default Payout;
