import mongoose, { Schema, Document } from "mongoose";

export interface IOtp extends Document {
  phone: string;
  otp: string;
  expiresAt: Date;
  attempts: number;
  isUsed: boolean;
}

const otpSchema = new Schema<IOtp>(
  {
    phone: {
      type: String,
      required: true,
      index: true,
    },
    otp: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index — auto-deletes when expired
    },
    attempts: {
      type: Number,
      default: 0,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Otp = mongoose.model<IOtp>("Otp", otpSchema);
export default Otp;
