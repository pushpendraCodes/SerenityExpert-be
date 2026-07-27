import mongoose, { Schema, Document, Types } from "mongoose";
import { StaffApplicationStatus } from "../types/index.js";

export interface IStaffApplication extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  status: StaffApplicationStatus;
  feeAmount: number;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  rejectionReason?: string;
  reviewedAt?: Date;
  reviewedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const staffApplicationSchema = new Schema<IStaffApplication>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(StaffApplicationStatus),
      default: StaffApplicationStatus.PENDING_PAYMENT,
      index: true,
    },
    feeAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    razorpayOrderId: {
      type: String,
      sparse: true,
    },
    razorpayPaymentId: String,
    razorpaySignature: String,
    rejectionReason: String,
    reviewedAt: Date,
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
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

staffApplicationSchema.index({ userId: 1, status: 1 });
staffApplicationSchema.index({ createdAt: -1 });

const StaffApplication = mongoose.model<IStaffApplication>(
  "StaffApplication",
  staffApplicationSchema
);
export default StaffApplication;
