import { Request, Response } from "express";
import User from "../models/User.js";
import Expert from "../models/Expert.js";
import Transaction from "../models/Transaction.js";
import Call from "../models/Call.js";
import Recharge from "../models/Recharge.js";
import Chat from "../models/Chat.js";
import * as authService from "../services/auth.service.js";
import * as notificationService from "../services/notification.service.js";
import { uploadImage } from "../services/cloudinary.service.js";
import { sendSuccess, sendPaginated } from "../utils/response.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getParam } from "../utils/params.js";
import { paginate } from "../utils/pagination.js";

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  // realName + dob are select:false (private) — explicitly include them for the owner only.
  const user = await User.findById(req.user!._id).select("+realName +dob");
  const staff = await Expert.findOne({ userId: req.user!._id, isApproved: true }).select(
    "_id status isApproved pricePerMinute"
  );
  return sendSuccess(res, {
    ...user?.toJSON(),
    hasStaffProfile: Boolean(staff),
    staffProfile: staff || undefined,
  });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const { email, gender, country, city, state } = req.body;
  const updates: Record<string, unknown> = {};
  // Public handle (`name`) is immutable after signup
  if (email) updates.email = email;
  if (gender) updates.gender = gender;
  if (country) updates.country = country;
  if (city) updates.city = city;
  if (state) updates.state = state;

  const user = await User.findByIdAndUpdate(req.user!._id, updates, {
    new: true,
    runValidators: true,
  });
  return sendSuccess(res, user, "Profile updated");
});

export const completeProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.completeProfile(req.user!._id.toString(), req.body);
  return sendSuccess(res, user, "Profile completed");
});

export const uploadAvatar = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    return sendSuccess(res, null, "No file uploaded");
  }
  const { url } = await uploadImage(req.file.buffer, "avatars", req.user!._id.toString());
  const user = await User.findByIdAndUpdate(req.user!._id, { avatar: url }, { new: true });
  return sendSuccess(res, user, "Avatar updated");
});

export const getWallet = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!._id).select("walletBalance freeSecondsRemaining");
  const transactions = await Transaction.find({ userId: req.user!._id })
    .sort({ createdAt: -1 })
    .limit(10);
  return sendSuccess(res, {
    balance: user?.walletBalance ?? 0,
    freeSecondsRemaining: user?.freeSecondsRemaining ?? 0,
    recentTransactions: transactions,
  });
});

export const getHistory = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!._id;
  const [calls, chats, recharges] = await Promise.all([
    Call.find({ userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate({ path: "expertId", populate: { path: "userId", select: "name avatar" } }),
    Chat.find({ userId })
      .sort({ updatedAt: -1 })
      .limit(20)
      .populate({ path: "expertId", populate: { path: "userId", select: "name avatar" } }),
    Recharge.find({ userId }).sort({ createdAt: -1 }).limit(20),
  ]);
  return sendSuccess(res, { calls, chats, recharges });
});

export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const result = await notificationService.getUserNotifications(req.user!._id.toString(), req.query);
  return sendPaginated(res, result);
});

export const markNotificationRead = asyncHandler(async (req: Request, res: Response) => {
  await notificationService.markNotificationRead(req.user!._id.toString(), getParam(req, "id"));
  return sendSuccess(res, null, "Notification marked as read");
});

export const registerFcmToken = asyncHandler(async (req: Request, res: Response) => {
  await authService.registerFcmToken(req.user!._id.toString(), req.body.token);
  return sendSuccess(res, null, "FCM token registered");
});

export const getTransactions = asyncHandler(async (req: Request, res: Response) => {
  const result = await paginate({
    model: Transaction,
    filter: { userId: req.user!._id },
    query: req.query,
    sort: { createdAt: -1 },
  });
  return sendPaginated(res, result);
});
