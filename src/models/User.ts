import mongoose, { Schema, Document, Types } from "mongoose";
import { UserRole } from "../types/index.js";

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  phone: string;
  email?: string;
  avatar: string;
  googleId?: string;
  role: UserRole;
  isVerified: boolean;
  isBlocked: boolean;
  walletBalance: number;
  fcmTokens: string[];
  refreshToken?: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    googleId: {
      type: String,
      sparse: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    walletBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    fcmTokens: {
      type: [String],
      default: [],
    },
    refreshToken: {
      type: String,
      select: false,
    },
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        Reflect.deleteProperty(ret, "__v");
        Reflect.deleteProperty(ret, "refreshToken");
        return ret;
      },
    },
  }
);

// Indexes
userSchema.index({ email: 1 }, { sparse: true });
userSchema.index({ googleId: 1 }, { sparse: true });
userSchema.index({ role: 1 });

const User = mongoose.model<IUser>("User", userSchema);
export default User;
