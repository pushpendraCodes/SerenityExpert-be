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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminController = __importStar(require("../controllers/admin.controller.js"));
const auth_js_1 = require("../middlewares/auth.js");
const validate_js_1 = require("../middlewares/validate.js");
const user_validator_js_1 = require("../validators/user.validator.js");
const admin_validator_js_1 = require("../validators/admin.validator.js");
const router = (0, express_1.Router)();
// Public CMS content
router.get("/public/faqs", adminController.listPublicFaqs);
router.get("/public/banners", adminController.listPublicBanners);
router.use(auth_js_1.authenticate, auth_js_1.requireAdmin);
// Dashboard
router.get("/dashboard", adminController.getDashboard);
router.get("/analytics", (0, validate_js_1.validate)(admin_validator_js_1.analyticsQuerySchema, "query"), adminController.getAnalytics);
// Users
router.get("/users", (0, validate_js_1.validate)(user_validator_js_1.paginationSchema, "query"), adminController.listUsers);
router.put("/users/:id", (0, validate_js_1.validate)(admin_validator_js_1.manageUserSchema), adminController.updateUser);
router.put("/users/:id/wallet", (0, validate_js_1.validate)(admin_validator_js_1.walletAdjustmentSchema), adminController.adjustUserWallet);
// Experts
router.get("/experts", (0, validate_js_1.validate)(user_validator_js_1.paginationSchema, "query"), adminController.listExperts);
router.post("/experts", (0, validate_js_1.validate)(admin_validator_js_1.createExpertSchema), adminController.createExpert);
router.put("/experts/:id/approve", (0, validate_js_1.validate)(admin_validator_js_1.approveExpertSchema), adminController.approveExpert);
router.put("/experts/:id", (0, validate_js_1.validate)(admin_validator_js_1.updateExpertSchema), adminController.updateExpert);
// Calls
router.get("/calls/live", adminController.getLiveCalls);
router.get("/calls", (0, validate_js_1.validate)(user_validator_js_1.paginationSchema, "query"), adminController.listCalls);
router.get("/calls/:id", adminController.getCallDetails);
router.post("/calls/:id/force-end", adminController.forceEndCall);
// Payments
router.get("/transactions", (0, validate_js_1.validate)(user_validator_js_1.paginationSchema, "query"), adminController.getTransactions);
router.get("/commission-report", adminController.getCommissionReport);
router.post("/refunds", (0, validate_js_1.validate)(admin_validator_js_1.refundSchema), adminController.issueRefund);
router.get("/payouts", (0, validate_js_1.validate)(user_validator_js_1.paginationSchema, "query"), adminController.getPayouts);
router.post("/payouts/process", adminController.processPayouts);
// Moderation
router.get("/reports", (0, validate_js_1.validate)(user_validator_js_1.paginationSchema, "query"), adminController.getReports);
router.put("/reports/:id", (0, validate_js_1.validate)(admin_validator_js_1.resolveReportSchema), adminController.resolveReport);
router.get("/community", (0, validate_js_1.validate)(user_validator_js_1.paginationSchema, "query"), adminController.getCommunityContent);
router.put("/community/questions/:id/moderate", (0, validate_js_1.validate)(admin_validator_js_1.moderateQuestionSchema), adminController.moderateQuestion);
router.post("/community/questions/:id/ai-check", adminController.aiModerateQuestion);
router.delete("/community/questions/:id", adminController.deleteQuestion);
router.delete("/community/comments/:id", adminController.deleteComment);
// Settings
router.get("/settings", adminController.getSettings);
router.put("/settings", (0, validate_js_1.validate)(admin_validator_js_1.updateSettingsSchema), adminController.updateSettings);
// Notifications
router.post("/notifications/push", (0, validate_js_1.validate)(admin_validator_js_1.pushNotificationSchema), adminController.sendPushNotification);
// CMS - Categories
router.get("/categories", adminController.listCategories);
router.post("/categories", (0, validate_js_1.validate)(admin_validator_js_1.createCategorySchema), adminController.createCategory);
router.put("/categories/:id", adminController.updateCategory);
router.delete("/categories/:id", adminController.deleteCategory);
// CMS - FAQs
router.get("/faqs", adminController.listFaqs);
router.post("/faqs", (0, validate_js_1.validate)(admin_validator_js_1.createFaqSchema), adminController.createFaq);
router.put("/faqs/:id", adminController.updateFaq);
router.delete("/faqs/:id", adminController.deleteFaq);
// CMS - Banners
router.get("/banners", adminController.listBanners);
router.post("/banners", (0, validate_js_1.validate)(admin_validator_js_1.createBannerSchema), adminController.createBanner);
router.put("/banners/:id", adminController.updateBanner);
router.delete("/banners/:id", adminController.deleteBanner);
// CMS - Coupons
router.get("/coupons", adminController.listCoupons);
router.post("/coupons", (0, validate_js_1.validate)(admin_validator_js_1.createCouponSchema), adminController.createCoupon);
router.put("/coupons/:id", adminController.updateCoupon);
router.delete("/coupons/:id", adminController.deleteCoupon);
exports.default = router;
//# sourceMappingURL=admin.routes.js.map