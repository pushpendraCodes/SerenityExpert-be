import mongoose, { Schema, Document, Types } from "mongoose";
import { CallStatus } from "../types/index.js";

export interface ICall extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  expertId: Types.ObjectId;
  agoraChannelName?: string;
  status: CallStatus;
  startedAt?: Date;
  endedAt?: Date;
  durationSeconds: number;
  totalCost: number;
  pricePerMinute: number;
  recordingUrl?: string;
  rating?: number;
  review?: string;
  endReason?: "completed" | "low_balance" | "expert_ended" | "user_ended" | "missed" | "rejected" | "force_ended";
  createdAt: Date;
  updatedAt: Date;
}

const callSchema = new Schema<ICall>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    expertId: {
      type: Schema.Types.ObjectId,
      ref: "Expert",
      required: true,
      index: true,
    },
    agoraChannelName: String,
    status: {
      type: String,
      enum: Object.values(CallStatus),
      default: CallStatus.RINGING,
    },
    startedAt: Date,
    endedAt: Date,
    durationSeconds: {
      type: Number,
      default: 0,
    },
    totalCost: {
      type: Number,
      default: 0,
    },
    pricePerMinute: {
      type: Number,
      required: true,
    },
    recordingUrl: String,
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    review: {
      type: String,
      maxlength: 500,
    },
    endReason: {
      type: String,
      enum: ["completed", "low_balance", "expert_ended", "user_ended", "missed", "rejected", "force_ended"],
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

callSchema.index({ status: 1 });
callSchema.index({ userId: 1, createdAt: -1 });
callSchema.index({ expertId: 1, createdAt: -1 });

const Call = mongoose.model<ICall>("Call", callSchema);
export default Call;
