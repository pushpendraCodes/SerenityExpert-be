import { Router } from "express";
import * as staffApplicationController from "../controllers/staffApplication.controller.js";
import { authenticate, requireUser, requireAdmin } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { z } from "zod";
import { paginationSchema, verifyPaymentSchema } from "../validators/user.validator.js";

const reviewSchema = z.object({
  approve: z.boolean(),
  rejectionReason: z.string().max(500).optional(),
  pricePerMinute: z.number().min(0).optional(),
  commissionPercent: z.number().min(0).max(100).optional(),
});

const router = Router();

/** User-facing */
router.post("/apply", authenticate, requireUser, staffApplicationController.apply);
router.post(
  "/apply/verify-payment",
  authenticate,
  requireUser,
  validate(verifyPaymentSchema),
  staffApplicationController.verifyPayment
);
router.get("/apply/me", authenticate, requireUser, staffApplicationController.getMine);

/** Admin */
router.get(
  "/applications",
  authenticate,
  requireAdmin,
  validate(paginationSchema, "query"),
  staffApplicationController.listApplications
);
router.post(
  "/applications/sync-experts",
  authenticate,
  requireAdmin,
  staffApplicationController.syncExperts
);
router.put(
  "/applications/:id/review",
  authenticate,
  requireAdmin,
  validate(reviewSchema),
  staffApplicationController.review
);

export default router;
