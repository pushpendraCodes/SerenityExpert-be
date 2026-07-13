import { Router } from "express";
import * as userController from "../controllers/user.controller.js";
import { authenticate, requireUser } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { avatarUpload } from "../middlewares/upload.js";
import {
  updateProfileSchema,
  fcmTokenSchema,
  paginationSchema,
} from "../validators/user.validator.js";

const router = Router();

router.use(authenticate, requireUser);

router.get("/me", userController.getMe);
router.put("/me", validate(updateProfileSchema), userController.updateProfile);
router.post("/me/avatar", avatarUpload, userController.uploadAvatar);
router.get("/me/wallet", userController.getWallet);
router.get("/me/history", userController.getHistory);
router.get("/me/notifications", validate(paginationSchema, "query"), userController.getNotifications);
router.put("/me/notifications/:id/read", userController.markNotificationRead);
router.put("/me/fcm-token", validate(fcmTokenSchema), userController.registerFcmToken);

export default router;
