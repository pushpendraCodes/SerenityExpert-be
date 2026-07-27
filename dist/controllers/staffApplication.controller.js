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
exports.syncExperts = exports.review = exports.listApplications = exports.getMine = exports.verifyPayment = exports.apply = void 0;
const staffApplicationService = __importStar(require("../services/staffApplication.service.js"));
const response_js_1 = require("../utils/response.js");
const asyncHandler_js_1 = require("../utils/asyncHandler.js");
const params_js_1 = require("../utils/params.js");
exports.apply = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const result = await staffApplicationService.applyForStaff(req.user._id.toString());
    return (0, response_js_1.sendCreated)(res, result, "Staff application created");
});
exports.verifyPayment = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const application = await staffApplicationService.verifyStaffApplicationPayment(req.user._id.toString(), req.body);
    return (0, response_js_1.sendSuccess)(res, application, "Payment verified — pending admin review");
});
exports.getMine = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const application = await staffApplicationService.getMyStaffApplication(req.user._id.toString());
    return (0, response_js_1.sendSuccess)(res, application);
});
exports.listApplications = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const result = await staffApplicationService.listStaffApplications(req.query);
    return (0, response_js_1.sendPaginated)(res, result);
});
exports.review = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const result = await staffApplicationService.reviewStaffApplication((0, params_js_1.getParam)(req, "id"), req.user._id.toString(), {
        approve: Boolean(req.body.approve),
        rejectionReason: req.body.rejectionReason,
        pricePerMinute: req.body.pricePerMinute,
        commissionPercent: req.body.commissionPercent,
    });
    return (0, response_js_1.sendSuccess)(res, result, req.body.approve
        ? "Approved — call profile created. User can appear on Chat & Call."
        : "Rejected");
});
/** Create missing Expert records for already-approved applications */
exports.syncExperts = (0, asyncHandler_js_1.asyncHandler)(async (_req, res) => {
    const result = await staffApplicationService.syncExpertsFromApprovedApplications();
    return (0, response_js_1.sendSuccess)(res, result, `Synced: ${result.expertsCreated} created, ${result.expertsUpdated} updated`);
});
//# sourceMappingURL=staffApplication.controller.js.map