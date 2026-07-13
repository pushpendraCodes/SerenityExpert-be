import mongoose, { Schema, Document, Types } from "mongoose";
import { TransactionType, TransactionStatus } from "../types/index.js";

export interface ITransaction extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  referenceId?: string;
  referenceType?: "call" | "chat" | "recharge" | "payout" | "adjustment";
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  description: string;
  status: TransactionStatus;
  createdAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(TransactionType),
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    balanceBefore: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    referenceId: String,
    referenceType: {
      type: String,
      enum: ["call", "chat", "recharge", "payout", "adjustment"],
    },
    razorpayPaymentId: String,
    razorpayOrderId: String,
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(TransactionStatus),
      default: TransactionStatus.COMPLETED,
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

// Compound indexes
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ type: 1, createdAt: -1 });
transactionSchema.index({ status: 1 });

const Transaction = mongoose.model<ITransaction>("Transaction", transactionSchema);
export default Transaction;
