import { Router } from "express";
import * as adminController from "../controllers/admin.controller.js";
import { authenticate, requireAdmin } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { paginationSchema } from "../validators/user.validator.js";
import {
  manageUserSchema,
  walletAdjustmentSchema,
  approveExpertSchema,
  createExpertSchema,
  updateSettingsSchema,
  createCategorySchema,
  createFaqSchema,
  createBannerSchema,
  createCouponSchema,
  resolveReportSchema,
  pushNotificationSchema,
  analyticsQuerySchema,
} from "../validators/admin.validator.js";

const router = Router();

// Public CMS content
router.get("/public/faqs", adminController.listPublicFaqs);
router.get("/public/banners", adminController.listPublicBanners);

router.use(authenticate, requireAdmin);

// Dashboard
router.get("/dashboard", adminController.getDashboard);
router.get("/analytics", validate(analyticsQuerySchema, "query"), adminController.getAnalytics);

// Users
router.get("/users", validate(paginationSchema, "query"), adminController.listUsers);
router.put("/users/:id", validate(manageUserSchema), adminController.updateUser);
router.put("/users/:id/wallet", validate(walletAdjustmentSchema), adminController.adjustUserWallet);

// Experts
router.get("/experts", validate(paginationSchema, "query"), adminController.listExperts);
router.post("/experts", validate(createExpertSchema), adminController.createExpert);
router.put("/experts/:id/approve", validate(approveExpertSchema), adminController.approveExpert);

// Calls
router.get("/calls/live", adminController.getLiveCalls);
router.get("/calls/:id", adminController.getCallDetails);
router.post("/calls/:id/force-end", adminController.forceEndCall);

// Payments
router.get("/transactions", validate(paginationSchema, "query"), adminController.getTransactions);
router.get("/payouts", validate(paginationSchema, "query"), adminController.getPayouts);
router.post("/payouts/process", adminController.processPayouts);

// Moderation
router.get("/reports", validate(paginationSchema, "query"), adminController.getReports);
router.put("/reports/:id", validate(resolveReportSchema), adminController.resolveReport);
router.get("/community", validate(paginationSchema, "query"), adminController.getCommunityContent);
router.delete("/community/questions/:id", adminController.deleteQuestion);
router.delete("/community/comments/:id", adminController.deleteComment);

// Settings
router.get("/settings", adminController.getSettings);
router.put("/settings", validate(updateSettingsSchema), adminController.updateSettings);

// Notifications
router.post("/notifications/push", validate(pushNotificationSchema), adminController.sendPushNotification);

// CMS - Categories
router.get("/categories", adminController.listCategories);
router.post("/categories", validate(createCategorySchema), adminController.createCategory);
router.put("/categories/:id", adminController.updateCategory);
router.delete("/categories/:id", adminController.deleteCategory);

// CMS - FAQs
router.get("/faqs", adminController.listFaqs);
router.post("/faqs", validate(createFaqSchema), adminController.createFaq);
router.put("/faqs/:id", adminController.updateFaq);
router.delete("/faqs/:id", adminController.deleteFaq);

// CMS - Banners
router.get("/banners", adminController.listBanners);
router.post("/banners", validate(createBannerSchema), adminController.createBanner);
router.put("/banners/:id", adminController.updateBanner);
router.delete("/banners/:id", adminController.deleteBanner);

// CMS - Coupons
router.get("/coupons", adminController.listCoupons);
router.post("/coupons", validate(createCouponSchema), adminController.createCoupon);
router.put("/coupons/:id", adminController.updateCoupon);
router.delete("/coupons/:id", adminController.deleteCoupon);

export default router;
