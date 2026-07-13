import { Request, Response } from "express";
import * as expertService from "../services/expert.service.js";
import { sendSuccess, sendCreated, sendPaginated } from "../utils/response.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getParam } from "../utils/params.js";

export const browseExperts = asyncHandler(async (req: Request, res: Response) => {
  const result = await expertService.browseExperts(req.query);
  return sendPaginated(res, result);
});

export const getExpertById = asyncHandler(async (req: Request, res: Response) => {
  const expert = await expertService.getExpertProfile(getParam(req, "id"));
  return sendSuccess(res, expert);
});

export const getExpertReviews = asyncHandler(async (req: Request, res: Response) => {
  const reviews = await expertService.getExpertReviews(getParam(req, "id"));
  return sendSuccess(res, reviews);
});

export const getCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await expertService.getPublicCategories();
  return sendSuccess(res, categories);
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const expert = await expertService.updateExpertProfile(req.user!._id.toString(), req.body);
  return sendSuccess(res, expert, "Expert profile updated");
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const expert = await expertService.updateExpertStatus(req.user!._id.toString(), req.body.status);
  return sendSuccess(res, expert, "Status updated");
});

export const updateAvailability = asyncHandler(async (req: Request, res: Response) => {
  const expert = await expertService.updateAvailability(req.user!._id.toString(), req.body.availabilitySchedule);
  return sendSuccess(res, expert, "Availability updated");
});

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const dashboard = await expertService.getExpertDashboard(req.user!._id.toString());
  return sendSuccess(res, dashboard);
});

export const getEarnings = asyncHandler(async (req: Request, res: Response) => {
  const result = await expertService.getExpertEarnings(req.user!._id.toString(), req.query);
  return sendPaginated(res, result);
});

export const requestWithdraw = asyncHandler(async (req: Request, res: Response) => {
  const payout = await expertService.requestWithdrawal(req.user!._id.toString());
  return sendCreated(res, payout, "Withdrawal request submitted");
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const dashboard = await expertService.getExpertDashboard(req.user!._id.toString());
  return sendSuccess(res, dashboard.expert);
});
