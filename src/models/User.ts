import mongoose, { Schema, Document, Types } from "mongoose";
import { UserRole, Gender } from "../types/index.js";

export interface IUser extends Document {
  _id: Types.ObjectId;
  /** Public display name — auto-generated, shown to everyone (never the real name). */
  name: string;
  /** Real name collected at signup. Private — never exposed publicly. */
  realName?: string;
  /** Date of birth collected at signup. Private. */
  dob?: Date;
  phone: string;
  email?: string;
  avatar: string;
  googleId?: string;
  role: UserRole;
  gender?: Gender;
  country?: string;
  city?: string;
  state?: string;
  profileCompleted: boolean;
  freeSecondsRemaining: number;
  isVerified: boolean;
  isBlocked: boolean;
  walletBalance: number;
  fcmTokens: string[];
  refreshToken?: string;
  /** Staff portal refresh — independent from user-app session */
  staffRefreshToken?: string;
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
    realName: {
      type: String,
      trim: true,
      maxlength: 100,
      select: false,
    },
    dob: {
      type: Date,
      select: false,
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
    gender: {
      type: String,
      enum: Object.values(Gender),
    },
    country: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    city: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    state: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    profileCompleted: {
      type: Boolean,
      default: false,
    },
    freeSecondsRemaining: {
      type: Number,
      default: 300,
      min: 0,
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
    staffRefreshToken: {
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
        Reflect.deleteProperty(ret, "staffRefreshToken");
        return ret;
      },
    },
  }
);

userSchema.index({ email: 1 }, { sparse: true });
userSchema.index({ googleId: 1 }, { sparse: true });
userSchema.index({ role: 1 });

const User = mongoose.model<IUser>("User", userSchema);
export default User;
