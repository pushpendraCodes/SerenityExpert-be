import { Router } from "express";
import * as expertController from "../controllers/expert.controller.js";
import { authenticate, requireUser, requireExpert, requireApprovedExpert } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import {
  updateExpertProfileSchema,
  updateStatusSchema,
  updateAvailabilitySchema,
  browseExpertsSchema,
} from "../validators/expert.validator.js";
import { paginationSchema } from "../validators/user.validator.js";

const router = Router();

// Public routes
router.get("/", validate(browseExpertsSchema, "query"), expertController.browseExperts);
router.get("/categories/list", expertController.getCategories);
router.get("/:id/reviews", expertController.getExpertReviews);
router.get("/:id", expertController.getExpertById);

// Expert-only routes (login via /api/auth/expert/* after admin approval)
const expertRouter = Router();
expertRouter.use(authenticate, requireUser, requireExpert);

expertRouter.get("/me/profile", expertController.getMe);
expertRouter.put("/me", validate(updateExpertProfileSchema), expertController.updateProfile);
expertRouter.put("/me/status", requireApprovedExpert, validate(updateStatusSchema), expertController.updateStatus);
expertRouter.put("/me/availability", validate(updateAvailabilitySchema), expertController.updateAvailability);
expertRouter.get("/me/dashboard", expertController.getDashboard);
expertRouter.get("/me/earnings", validate(paginationSchema, "query"), expertController.getEarnings);
expertRouter.post("/me/withdraw", requireApprovedExpert, expertController.requestWithdraw);

router.use(expertRouter);

export default router;
