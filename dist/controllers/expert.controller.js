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
exports.getMe = exports.requestWithdraw = exports.getEarnings = exports.getDashboard = exports.updateAvailability = exports.updateStatus = exports.updateProfile = exports.getCategories = exports.getExpertReviews = exports.getExpertById = exports.browseExperts = void 0;
const expertService = __importStar(require("../services/expert.service.js"));
const response_js_1 = require("../utils/response.js");
const asyncHandler_js_1 = require("../utils/asyncHandler.js");
const params_js_1 = require("../utils/params.js");
exports.browseExperts = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const result = await expertService.browseExperts(req.query);
    return (0, response_js_1.sendPaginated)(res, result);
});
exports.getExpertById = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const expert = await expertService.getExpertProfile((0, params_js_1.getParam)(req, "id"));
    return (0, response_js_1.sendSuccess)(res, expert);
});
exports.getExpertReviews = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const result = await expertService.getExpertReviews((0, params_js_1.getParam)(req, "id"), req.query);
    return (0, response_js_1.sendPaginated)(res, result);
});
exports.getCategories = (0, asyncHandler_js_1.asyncHandler)(async (_req, res) => {
    const categories = await expertService.getPublicCategories();
    return (0, response_js_1.sendSuccess)(res, categories);
});
exports.updateProfile = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const expert = await expertService.updateExpertProfile(req.user._id.toString(), req.body);
    return (0, response_js_1.sendSuccess)(res, expert, "Expert profile updated");
});
exports.updateStatus = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const expert = await expertService.updateExpertStatus(req.user._id.toString(), req.body.status);
    return (0, response_js_1.sendSuccess)(res, expert, "Status updated");
});
exports.updateAvailability = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const expert = await expertService.updateAvailability(req.user._id.toString(), req.body.availabilitySchedule);
    return (0, response_js_1.sendSuccess)(res, expert, "Availability updated");
});
exports.getDashboard = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const dashboard = await expertService.getExpertDashboard(req.user._id.toString());
    return (0, response_js_1.sendSuccess)(res, dashboard);
});
exports.getEarnings = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const result = await expertService.getExpertEarnings(req.user._id.toString(), req.query);
    return (0, response_js_1.sendPaginated)(res, result);
});
exports.requestWithdraw = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const payout = await expertService.requestWithdrawal(req.user._id.toString());
    return (0, response_js_1.sendCreated)(res, payout, "Withdrawal request submitted");
});
exports.getMe = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const dashboard = await expertService.getExpertDashboard(req.user._id.toString());
    return (0, response_js_1.sendSuccess)(res, dashboard.expert);
});
//# sourceMappingURL=expert.controller.js.map