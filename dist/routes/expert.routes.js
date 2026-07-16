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
const expertController = __importStar(require("../controllers/expert.controller.js"));
const auth_js_1 = require("../middlewares/auth.js");
const validate_js_1 = require("../middlewares/validate.js");
const expert_validator_js_1 = require("../validators/expert.validator.js");
const user_validator_js_1 = require("../validators/user.validator.js");
const router = (0, express_1.Router)();
// Public routes
router.get("/", (0, validate_js_1.validate)(expert_validator_js_1.browseExpertsSchema, "query"), expertController.browseExperts);
router.get("/categories/list", expertController.getCategories);
router.get("/:id/reviews", expertController.getExpertReviews);
router.get("/:id", expertController.getExpertById);
// Expert-only routes (login via /api/auth/expert/* after admin approval)
const expertRouter = (0, express_1.Router)();
expertRouter.use(auth_js_1.authenticate, auth_js_1.requireUser, auth_js_1.requireExpert);
expertRouter.get("/me/profile", expertController.getMe);
expertRouter.put("/me", (0, validate_js_1.validate)(expert_validator_js_1.updateExpertProfileSchema), expertController.updateProfile);
expertRouter.put("/me/status", auth_js_1.requireApprovedExpert, (0, validate_js_1.validate)(expert_validator_js_1.updateStatusSchema), expertController.updateStatus);
expertRouter.put("/me/availability", (0, validate_js_1.validate)(expert_validator_js_1.updateAvailabilitySchema), expertController.updateAvailability);
expertRouter.get("/me/dashboard", expertController.getDashboard);
expertRouter.get("/me/earnings", (0, validate_js_1.validate)(user_validator_js_1.paginationSchema, "query"), expertController.getEarnings);
router.use(expertRouter);
exports.default = router;
//# sourceMappingURL=expert.routes.js.map