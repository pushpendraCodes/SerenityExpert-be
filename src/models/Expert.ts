import mongoose, { Schema, Document, Types } from "mongoose";
import { ExpertStatus } from "../types/index.js";
import type { AvailabilitySlot, BankDetails } from "../types/index.js";

export interface IExpert extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  mobile: string;
  bio: string;
  experience: number; // years
  categories: Types.ObjectId[];
  languages: string[];
  pricePerMinute: number; // Set by admin only
  rating: number;
  totalRatings: number;
  totalCalls: number;
  totalMinutes: number;
  totalEarnings: number;
  status: ExpertStatus;
  availabilitySchedule: AvailabilitySlot[];
  isVerified: boolean;
  isApproved: boolean;
  rejectionReason?: string;
  bankDetails?: BankDetails;
  commissionPercent: number;
  createdAt: Date;
  updatedAt: Date;
}

const availabilitySlotSchema = new Schema<AvailabilitySlot>(
  {
    day: {
      type: String,
      enum: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
      required: true,
    },
    startTime: { type: String, required: true }, // HH:mm
    endTime: { type: String, required: true },
  },
  { _id: false }
);

const bankDetailsSchema = new Schema<BankDetails>(
  {
    accountName: { type: String, trim: true },
    accountNumber: { type: String, trim: true },
    ifscCode: { type: String, trim: true },
    bankName: { type: String, trim: true },
    upiId: { type: String, trim: true },
  },
  { _id: false }
);

const expertSchema = new Schema<IExpert>(
  {
    userId: {
      type: Schema.Types.ObjectId,
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
      type: Schema.Types.ObjectId,
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
      enum: Object.values(ExpertStatus),
      default: ExpertStatus.OFFLINE,
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

// Indexes
expertSchema.index({ categories: 1 });
expertSchema.index({ status: 1 });
expertSchema.index({ isApproved: 1 });
expertSchema.index({ rating: -1 });
expertSchema.index({ pricePerMinute: 1 });

const Expert = mongoose.model<IExpert>("Expert", expertSchema);
export default Expert;
