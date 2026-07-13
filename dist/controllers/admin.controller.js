"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listPublicBanners = exports.listPublicFaqs = exports.deleteCoupon = exports.updateCoupon = exports.createCoupon = exports.listCoupons = exports.deleteBanner = exports.updateBanner = exports.createBanner = exports.listBanners = exports.deleteFaq = exports.updateFaq = exports.createFaq = exports.listFaqs = exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.listCategories = exports.sendPushNotification = exports.updateSettings = exports.getSettings = exports.deleteComment = exports.deleteQuestion = exports.getCommunityContent = exports.resolveReport = exports.getReports = exports.processPayouts = exports.getPayouts = exports.getTransactions = exports.forceEndCall = exports.getCallDetails = exports.getLiveCalls = exports.approveExpert = exports.createExpert = exports.listExperts = exports.adjustUserWallet = exports.updateUser = exports.listUsers = exports.getAnalytics = exports.getDashboard = void 0;
const adminService = __importStar(require("../services/admin.service.js"));
const expertService = __importStar(require("../services/expert.service.js"));
const callService = __importStar(require("../services/call.service.js"));
const payoutService = __importStar(require("../services/payout.service.js"));
const notificationService = __importStar(require("../services/notification.service.js"));
const communityService = __importStar(require("../services/community.service.js"));
const wallet_service_js_1 = require("../services/wallet.service.js");
const Call_js_1 = __importDefault(require("../models/Call.js"));
const response_js_1 = require("../utils/response.js");
const asyncHandler_js_1 = require("../utils/asyncHandler.js");
const params_js_1 = require("../utils/params.js");
exports.getDashboard = (0, asyncHandler_js_1.asyncHandler)(async (_req, res) => {
    const metrics = await adminService.getDashboardMetrics();
    return (0, response_js_1.sendSuccess)(res, metrics);
});
exports.getAnalytics = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const analytics = await adminService.getAnalytics(req.query.period);
    return (0, response_js_1.sendSuccess)(res, analytics);
});
exports.listUsers = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const result = await adminService.listUsers(req.query);
    return (0, response_js_1.sendPaginated)(res, result);
});
exports.updateUser = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const user = await adminService.updateUser((0, params_js_1.getParam)(req, "id"), req.body);
    return (0, response_js_1.sendSuccess)(res, user, "User updated");
});
exports.adjustUserWallet = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const { amount, description, type } = req.body;
    const result = await (0, wallet_service_js_1.adjustWallet)((0, params_js_1.getParam)(req, "id"), amount, type, description, req.user._id.toString());
    return (0, response_js_1.sendSuccess)(res, result, "Wallet adjusted");
});
exports.listExperts = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const result = await adminService.listExperts(req.query);
    return (0, response_js_1.sendPaginated)(res, result);
});
exports.createExpert = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const expert = await expertService.createExpertByAdmin(req.body);
    return (0, response_js_1.sendCreated)(res, expert, "Expert created. Approve to enable login.");
});
exports.approveExpert = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const expert = await adminService.approveExpert((0, params_js_1.getParam)(req, "id"), req.body);
    return (0, response_js_1.sendSuccess)(res, expert, "Expert updated");
});
exports.getLiveCalls = (0, asyncHandler_js_1.asyncHandler)(async (_req, res) => {
    const calls = await callService.getLiveCalls();
    return (0, response_js_1.sendSuccess)(res, calls);
});
exports.getCallDetails = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const call = await Call_js_1.default.findById((0, params_js_1.getParam)(req, "id"))
        .populate("userId", "name phone avatar")
        .populate({ path: "expertId", populate: { path: "userId", select: "name avatar" } });
    return (0, response_js_1.sendSuccess)(res, call);
});
exports.forceEndCall = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const call = await callService.endCall((0, params_js_1.getParam)(req, "id"), req.user._id.toString(), "force_ended");
    return (0, response_js_1.sendSuccess)(res, call, "Call force-ended");
});
exports.getTransactions = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const result = await adminService.getTransactions(req.query);
    return (0, response_js_1.sendPaginated)(res, result);
});
exports.getPayouts = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const result = await payoutService.getAllPayouts(req.query);
    return (0, response_js_1.sendPaginated)(res, result);
});
exports.processPayouts = (0, asyncHandler_js_1.asyncHandler)(async (_req, res) => {
    const count = await payoutService.processWeeklyPayouts();
    return (0, response_js_1.sendSuccess)(res, { processed: count }, "Payouts processed");
});
exports.getReports = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const result = await adminService.getReports(req.query);
    return (0, response_js_1.sendPaginated)(res, result);
});
exports.resolveReport = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const report = await adminService.resolveReport((0, params_js_1.getParam)(req, "id"), req.user._id.toString(), { status: req.body.status, action: req.body.action });
    return (0, response_js_1.sendSuccess)(res, report, "Report resolved");
});
exports.getCommunityContent = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const result = await adminService.cmsService.listCommunityContent(req.query);
    return (0, response_js_1.sendPaginated)(res, result);
});
exports.deleteQuestion = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    await communityService.adminDeleteQuestion((0, params_js_1.getParam)(req, "id"));
    return (0, response_js_1.sendSuccess)(res, null, "Question removed");
});
exports.deleteComment = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    await communityService.adminDeleteComment((0, params_js_1.getParam)(req, "id"));
    return (0, response_js_1.sendSuccess)(res, null, "Comment removed");
});
exports.getSettings = (0, asyncHandler_js_1.asyncHandler)(async (_req, res) => {
    const settings = await adminService.getSettings();
    return (0, response_js_1.sendSuccess)(res, settings);
});
exports.updateSettings = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    await adminService.updateSettings(req.body.settings, req.user._id.toString());
    const settings = await adminService.getSettings();
    return (0, response_js_1.sendSuccess)(res, settings, "Settings updated");
});
exports.sendPushNotification = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const count = await notificationService.sendBulkNotification(req.body.title, req.body.body, {
        userIds: req.body.userIds,
        role: req.body.role,
    });
    return (0, response_js_1.sendSuccess)(res, { sent: count }, "Notifications sent");
});
// CMS
exports.listCategories = (0, asyncHandler_js_1.asyncHandler)(async (_req, res) => {
    const categories = await adminService.cmsService.listCategories();
    return (0, response_js_1.sendSuccess)(res, categories);
});
exports.createCategory = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const category = await adminService.cmsService.createCategory({
        ...req.body,
        slug: req.body.slug || req.body.name.toLowerCase().replace(/\s+/g, "-"),
    });
    return (0, response_js_1.sendCreated)(res, category, "Category created");
});
exports.updateCategory = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const category = await adminService.cmsService.updateCategory((0, params_js_1.getParam)(req, "id"), req.body);
    return (0, response_js_1.sendSuccess)(res, category, "Category updated");
});
exports.deleteCategory = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    await adminService.cmsService.deleteCategory((0, params_js_1.getParam)(req, "id"));
    return (0, response_js_1.sendSuccess)(res, null, "Category deleted");
});
exports.listFaqs = (0, asyncHandler_js_1.asyncHandler)(async (_req, res) => {
    const faqs = await adminService.cmsService.listFaqs();
    return (0, response_js_1.sendSuccess)(res, faqs);
});
exports.createFaq = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const faq = await adminService.cmsService.createFaq(req.body);
    return (0, response_js_1.sendCreated)(res, faq, "FAQ created");
});
exports.updateFaq = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const faq = await adminService.cmsService.updateFaq((0, params_js_1.getParam)(req, "id"), req.body);
    return (0, response_js_1.sendSuccess)(res, faq, "FAQ updated");
});
exports.deleteFaq = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    await adminService.cmsService.deleteFaq((0, params_js_1.getParam)(req, "id"));
    return (0, response_js_1.sendSuccess)(res, null, "FAQ deleted");
});
exports.listBanners = (0, asyncHandler_js_1.asyncHandler)(async (_req, res) => {
    const banners = await adminService.cmsService.listBanners();
    return (0, response_js_1.sendSuccess)(res, banners);
});
exports.createBanner = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const banner = await adminService.cmsService.createBanner(req.body);
    return (0, response_js_1.sendCreated)(res, banner, "Banner created");
});
exports.updateBanner = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const banner = await adminService.cmsService.updateBanner((0, params_js_1.getParam)(req, "id"), req.body);
    return (0, response_js_1.sendSuccess)(res, banner, "Banner updated");
});
exports.deleteBanner = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    await adminService.cmsService.deleteBanner((0, params_js_1.getParam)(req, "id"));
    return (0, response_js_1.sendSuccess)(res, null, "Banner deleted");
});
exports.listCoupons = (0, asyncHandler_js_1.asyncHandler)(async (_req, res) => {
    const coupons = await adminService.cmsService.listCoupons();
    return (0, response_js_1.sendSuccess)(res, coupons);
});
exports.createCoupon = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const coupon = await adminService.cmsService.createCoupon({ ...req.body, code: req.body.code.toUpperCase() });
    return (0, response_js_1.sendCreated)(res, coupon, "Coupon created");
});
exports.updateCoupon = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const coupon = await adminService.cmsService.updateCoupon((0, params_js_1.getParam)(req, "id"), req.body);
    return (0, response_js_1.sendSuccess)(res, coupon, "Coupon updated");
});
exports.deleteCoupon = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    await adminService.cmsService.deleteCoupon((0, params_js_1.getParam)(req, "id"));
    return (0, response_js_1.sendSuccess)(res, null, "Coupon deleted");
});
exports.listPublicFaqs = (0, asyncHandler_js_1.asyncHandler)(async (_req, res) => {
    const faqs = await adminService.cmsService.listFaqs();
    return (0, response_js_1.sendSuccess)(res, faqs);
});
exports.listPublicBanners = (0, asyncHandler_js_1.asyncHandler)(async (_req, res) => {
    const banners = await adminService.cmsService.listBanners();
    return (0, response_js_1.sendSuccess)(res, banners);
});
//# sourceMappingURL=admin.controller.js.map