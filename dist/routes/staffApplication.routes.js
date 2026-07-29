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
const staffApplicationController = __importStar(require("../controllers/staffApplication.controller.js"));
const auth_js_1 = require("../middlewares/auth.js");
const validate_js_1 = require("../middlewares/validate.js");
const zod_1 = require("zod");
const user_validator_js_1 = require("../validators/user.validator.js");
const reviewSchema = zod_1.z.object({
    approve: zod_1.z.boolean(),
    rejectionReason: zod_1.z.string().max(500).optional(),
    pricePerMinute: zod_1.z.number().min(0).optional(),
    commissionPercent: zod_1.z.number().min(0).max(100).optional(),
});
const router = (0, express_1.Router)();
/** Public fee for call-button activation (from admin settings). */
router.get("/apply/fee", staffApplicationController.getFee);
/** User-facing */
router.post("/apply", auth_js_1.authenticate, auth_js_1.requireUser, staffApplicationController.apply);
router.post("/apply/verify-payment", auth_js_1.authenticate, auth_js_1.requireUser, (0, validate_js_1.validate)(user_validator_js_1.verifyPaymentSchema), staffApplicationController.verifyPayment);
router.get("/apply/me", auth_js_1.authenticate, auth_js_1.requireUser, staffApplicationController.getMine);
/** Admin */
router.get("/applications", auth_js_1.authenticate, auth_js_1.requireAdmin, (0, validate_js_1.validate)(user_validator_js_1.paginationSchema, "query"), staffApplicationController.listApplications);
router.post("/applications/sync-experts", auth_js_1.authenticate, auth_js_1.requireAdmin, staffApplicationController.syncExperts);
router.put("/applications/:id/review", auth_js_1.authenticate, auth_js_1.requireAdmin, (0, validate_js_1.validate)(reviewSchema), staffApplicationController.review);
exports.default = router;
//# sourceMappingURL=staffApplication.routes.js.map