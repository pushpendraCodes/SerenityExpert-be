import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { authenticate, requireUser } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { otpLimiter, authLimiter } from "../middlewares/rateLimiter.js";
import {
  sendOtpSchema,
  verifyOtpSchema,
  googleLoginSchema,
  refreshTokenSchema,
} from "../validators/auth.validator.js";

const router = Router();

router.post("/send-otp", otpLimiter, validate(sendOtpSchema), authController.sendOtp);
router.post("/verify-otp", authLimiter, validate(verifyOtpSchema), authController.verifyOtp);
router.post("/expert/send-otp", otpLimiter, validate(sendOtpSchema), authController.sendExpertOtp);
router.post("/expert/verify-otp", authLimiter, validate(verifyOtpSchema), authController.verifyExpertOtp);
router.post("/google", authLimiter, validate(googleLoginSchema), authController.googleLogin);
router.post("/refresh", validate(refreshTokenSchema), authController.refreshToken);
router.post("/logout", authenticate, requireUser, authController.logout);

export default router;
