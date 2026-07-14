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
const authController = __importStar(require("../controllers/auth.controller.js"));
const auth_js_1 = require("../middlewares/auth.js");
const validate_js_1 = require("../middlewares/validate.js");
const rateLimiter_js_1 = require("../middlewares/rateLimiter.js");
const auth_validator_js_1 = require("../validators/auth.validator.js");
const router = (0, express_1.Router)();
router.post("/send-otp", rateLimiter_js_1.otpLimiter, (0, validate_js_1.validate)(auth_validator_js_1.sendOtpSchema), authController.sendOtp);
router.post("/verify-otp", rateLimiter_js_1.authLimiter, (0, validate_js_1.validate)(auth_validator_js_1.verifyOtpSchema), authController.verifyOtp);
router.post("/expert/send-otp", rateLimiter_js_1.otpLimiter, (0, validate_js_1.validate)(auth_validator_js_1.sendOtpSchema), authController.sendExpertOtp);
router.post("/expert/verify-otp", rateLimiter_js_1.authLimiter, (0, validate_js_1.validate)(auth_validator_js_1.verifyOtpSchema), authController.verifyExpertOtp);
router.post("/google", rateLimiter_js_1.authLimiter, (0, validate_js_1.validate)(auth_validator_js_1.googleLoginSchema), authController.googleLogin);
router.post("/refresh", (0, validate_js_1.validate)(auth_validator_js_1.refreshTokenSchema), authController.refreshToken);
router.post("/logout", auth_js_1.authenticate, auth_js_1.requireUser, authController.logout);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map