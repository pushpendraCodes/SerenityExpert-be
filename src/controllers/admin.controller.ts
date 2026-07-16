import { Request, Response } from "express";
import * as adminService from "../services/admin.service.js";
import * as expertService from "../services/expert.service.js";
import * as callService from "../services/call.service.js";
import * as payoutService from "../services/payout.service.js";
import * as notificationService from "../services/notification.service.js";
import * as communityService from "../services/community.service.js";
import { adjustWallet } from "../services/wallet.service.js";
import Call from "../models/Call.js";
import { sendSuccess, sendCreated, sendPaginated } from "../utils/response.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getParam } from "../utils/params.js";
import { ReportStatus } from "../types/index.js";

export const getDashboard = asyncHandler(async (_req: Request, res: Response) => {
  const metrics = await adminService.getDashboardMetrics();
  return sendSuccess(res, metrics);
});

export const getAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const analytics = await adminService.getAnalytics(req.query.period as "week" | "month" | "year");
  return sendSuccess(res, analytics);
});

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const result = await adminService.listUsers(req.query);
  return sendPaginated(res, result);
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await adminService.updateUser(getParam(req, "id"), req.body);
  return sendSuccess(res, user, "User updated");
});

export const adjustUserWallet = asyncHandler(async (req: Request, res: Response) => {
  const { amount, description, type } = req.body;
  const result = await adjustWallet(getParam(req, "id"), amount, type, description, req.user!._id.toString());
  return sendSuccess(res, result, "Wallet adjusted");
});

export const listExperts = asyncHandler(async (req: Request, res: Response) => {
  const result = await adminService.listExperts(req.query);
  return sendPaginated(res, result);
});

export const createExpert = asyncHandler(async (req: Request, res: Response) => {
  const expert = await expertService.createExpertByAdmin(req.body);
  return sendCreated(res, expert, "Expert created. Approve to enable login.");
});

export const approveExpert = asyncHandler(async (req: Request, res: Response) => {
  const expert = await adminService.approveExpert(getParam(req, "id"), req.body);
  return sendSuccess(res, expert, "Expert updated");
});

export const updateExpert = asyncHandler(async (req: Request, res: Response) => {
  const expert = await adminService.updateExpertByAdmin(getParam(req, "id"), req.body);
  return sendSuccess(res, expert, "Expert updated");
});

export const getLiveCalls = asyncHandler(async (_req: Request, res: Response) => {
  const calls = await callService.getLiveCalls();
  return sendSuccess(res, calls);
});

export const getCallDetails = asyncHandler(async (req: Request, res: Response) => {
  const call = await Call.findById(getParam(req, "id"))
    .populate("userId", "name phone avatar")
    .populate({ path: "expertId", populate: { path: "userId", select: "name avatar" } });
  return sendSuccess(res, call);
});

export const forceEndCall = asyncHandler(async (req: Request, res: Response) => {
  const call = await callService.endCall(getParam(req, "id"), req.user!._id.toString(), "force_ended");
  return sendSuccess(res, call, "Call force-ended");
});

export const getTransactions = asyncHandler(async (req: Request, res: Response) => {
  const result = await adminService.getTransactions(req.query);
  return sendPaginated(res, result);
});

export const listCalls = asyncHandler(async (req: Request, res: Response) => {
  const result = await adminService.listCalls(req.query);
  return sendPaginated(res, result);
});

export const getCommissionReport = asyncHandler(async (req: Request, res: Response) => {
  const report = await adminService.getCommissionReport(
    req.query.period as "week" | "month" | "year"
  );
  return sendSuccess(res, report);
});

export const issueRefund = asyncHandler(async (req: Request, res: Response) => {
  const result = await adminService.issueRefund(req.body, req.user!._id.toString());
  return sendSuccess(res, result, "Refund issued");
});

export const getPayouts = asyncHandler(async (req: Request, res: Response) => {
  const result = await payoutService.getAllPayouts(req.query);
  return sendPaginated(res, result);
});

export const processPayouts = asyncHandler(async (_req: Request, res: Response) => {
  const count = await payoutService.processWeeklyPayouts();
  return sendSuccess(res, { processed: count }, "Payouts processed");
});

export const getReports = asyncHandler(async (req: Request, res: Response) => {
  const result = await adminService.getReports(req.query);
  return sendPaginated(res, result);
});

export const resolveReport = asyncHandler(async (req: Request, res: Response) => {
  const report = await adminService.resolveReport(
    getParam(req, "id"),
    req.user!._id.toString(),
    { status: req.body.status as ReportStatus, action: req.body.action }
  );
  return sendSuccess(res, report, "Report resolved");
});

export const getCommunityContent = asyncHandler(async (req: Request, res: Response) => {
  const result = await adminService.cmsService.listCommunityContent(req.query);
  return sendPaginated(res, result);
});

export const deleteQuestion = asyncHandler(async (req: Request, res: Response) => {
  await communityService.adminDeleteQuestion(getParam(req, "id"));
  return sendSuccess(res, null, "Question removed");
});

export const deleteComment = asyncHandler(async (req: Request, res: Response) => {
  await communityService.adminDeleteComment(getParam(req, "id"));
  return sendSuccess(res, null, "Comment removed");
});

export const moderateQuestion = asyncHandler(async (req: Request, res: Response) => {
  const question = await adminService.moderateQuestion(getParam(req, "id"), req.body);
  return sendSuccess(res, question, "Question moderated");
});

export const aiModerateQuestion = asyncHandler(async (req: Request, res: Response) => {
  const result = await adminService.runAiModerationOnQuestion(getParam(req, "id"));
  return sendSuccess(res, result, "AI moderation complete");
});

export const getSettings = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await adminService.getSettings();
  return sendSuccess(res, settings);
});

export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
  await adminService.updateSettings(req.body.settings, req.user!._id.toString());
  const settings = await adminService.getSettings();
  return sendSuccess(res, settings, "Settings updated");
});

export const sendPushNotification = asyncHandler(async (req: Request, res: Response) => {
  const count = await notificationService.sendBulkNotification(req.body.title, req.body.body, {
    userIds: req.body.userIds,
    role: req.body.role,
  });
  return sendSuccess(res, { sent: count }, "Notifications sent");
});

// CMS
export const listCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await adminService.cmsService.listCategories();
  return sendSuccess(res, categories);
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await adminService.cmsService.createCategory({
    ...req.body,
    slug: req.body.slug || req.body.name.toLowerCase().replace(/\s+/g, "-"),
  });
  return sendCreated(res, category, "Category created");
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await adminService.cmsService.updateCategory(getParam(req, "id"), req.body);
  return sendSuccess(res, category, "Category updated");
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  await adminService.cmsService.deleteCategory(getParam(req, "id"));
  return sendSuccess(res, null, "Category deleted");
});

export const listFaqs = asyncHandler(async (_req: Request, res: Response) => {
  const faqs = await adminService.cmsService.listFaqs();
  return sendSuccess(res, faqs);
});

export const createFaq = asyncHandler(async (req: Request, res: Response) => {
  const faq = await adminService.cmsService.createFaq(req.body);
  return sendCreated(res, faq, "FAQ created");
});

export const updateFaq = asyncHandler(async (req: Request, res: Response) => {
  const faq = await adminService.cmsService.updateFaq(getParam(req, "id"), req.body);
  return sendSuccess(res, faq, "FAQ updated");
});

export const deleteFaq = asyncHandler(async (req: Request, res: Response) => {
  await adminService.cmsService.deleteFaq(getParam(req, "id"));
  return sendSuccess(res, null, "FAQ deleted");
});

export const listBanners = asyncHandler(async (_req: Request, res: Response) => {
  const banners = await adminService.cmsService.listBanners();
  return sendSuccess(res, banners);
});

export const createBanner = asyncHandler(async (req: Request, res: Response) => {
  const banner = await adminService.cmsService.createBanner(req.body);
  return sendCreated(res, banner, "Banner created");
});

export const updateBanner = asyncHandler(async (req: Request, res: Response) => {
  const banner = await adminService.cmsService.updateBanner(getParam(req, "id"), req.body);
  return sendSuccess(res, banner, "Banner updated");
});

export const deleteBanner = asyncHandler(async (req: Request, res: Response) => {
  await adminService.cmsService.deleteBanner(getParam(req, "id"));
  return sendSuccess(res, null, "Banner deleted");
});

export const listCoupons = asyncHandler(async (_req: Request, res: Response) => {
  const coupons = await adminService.cmsService.listCoupons();
  return sendSuccess(res, coupons);
});

export const createCoupon = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await adminService.cmsService.createCoupon({ ...req.body, code: req.body.code.toUpperCase() });
  return sendCreated(res, coupon, "Coupon created");
});

export const updateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await adminService.cmsService.updateCoupon(getParam(req, "id"), req.body);
  return sendSuccess(res, coupon, "Coupon updated");
});

export const deleteCoupon = asyncHandler(async (req: Request, res: Response) => {
  await adminService.cmsService.deleteCoupon(getParam(req, "id"));
  return sendSuccess(res, null, "Coupon deleted");
});

export const listPublicFaqs = asyncHandler(async (_req: Request, res: Response) => {
  const faqs = await adminService.cmsService.listFaqs();
  return sendSuccess(res, faqs);
});

export const listPublicBanners = asyncHandler(async (_req: Request, res: Response) => {
  const banners = await adminService.cmsService.listBanners();
  return sendSuccess(res, banners);
});
