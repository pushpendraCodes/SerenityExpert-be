import { Request, Response } from "express";
import * as authService from "../services/auth.service.js";
import Expert from "../models/Expert.js";
import { AuthError } from "../utils/AppError.js";
import { sendSuccess, sendCreated } from "../utils/response.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const sendExpertOtp = asyncHandler(async (req: Request, res: Response) => {
  const { phone } = req.body;
  await authService.sendExpertOtp(phone);
  return sendSuccess(res, null, "OTP sent successfully");
});

export const verifyExpertOtp = asyncHandler(async (req: Request, res: Response) => {
  const { phone, otp } = req.body;
  const result = await authService.loginExpertWithOtp(phone, otp);
  return sendCreated(res, {
    user: result.user,
    expert: result.expert,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  }, "Expert login successful");
});

export const sendOtp = asyncHandler(async (req: Request, res: Response) => {
  const { phone } = req.body;
  const expert = await Expert.findOne({ mobile: phone });
  if (expert) {
    throw new AuthError("This mobile number is registered as an expert. Please use expert login.");
  }
  const { sendOtp: sendOtpFn } = await import("../services/otp.service.js");
  const otp = await sendOtpFn(phone);
  const isDev = process.env.NODE_ENV !== "production";
  return sendSuccess(res, isDev ? { otp } : null, "OTP sent successfully");
});

export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  const { phone, otp } = req.body;
  const result = await authService.loginWithOtp(phone, otp);
  return sendCreated(res, {
    user: result.user,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    isNewUser: result.isNewUser,
  }, "Login successful");
});

export const googleLogin = asyncHandler(async (req: Request, res: Response) => {
  const { idToken } = req.body;
  const result = await authService.loginWithGoogle(idToken);
  return sendCreated(res, {
    user: result.user,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    isNewUser: result.isNewUser,
  }, "Login successful");
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken: token } = req.body;
  const tokens = await authService.refreshAccessToken(token);
  return sendSuccess(res, tokens, "Token refreshed");
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  await authService.logout(req.user!._id.toString());
  return sendSuccess(res, null, "Logged out successfully");
});
