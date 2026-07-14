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
const userController = __importStar(require("../controllers/user.controller.js"));
const auth_js_1 = require("../middlewares/auth.js");
const validate_js_1 = require("../middlewares/validate.js");
const upload_js_1 = require("../middlewares/upload.js");
const user_validator_js_1 = require("../validators/user.validator.js");
const router = (0, express_1.Router)();
router.use(auth_js_1.authenticate, auth_js_1.requireUser);
router.get("/me", userController.getMe);
router.put("/me", (0, validate_js_1.validate)(user_validator_js_1.updateProfileSchema), userController.updateProfile);
router.post("/me/avatar", upload_js_1.avatarUpload, userController.uploadAvatar);
router.get("/me/wallet", userController.getWallet);
router.get("/me/history", userController.getHistory);
router.get("/me/notifications", (0, validate_js_1.validate)(user_validator_js_1.paginationSchema, "query"), userController.getNotifications);
router.put("/me/notifications/:id/read", userController.markNotificationRead);
router.put("/me/fcm-token", (0, validate_js_1.validate)(user_validator_js_1.fcmTokenSchema), userController.registerFcmToken);
exports.default = router;
//# sourceMappingURL=user.routes.js.map