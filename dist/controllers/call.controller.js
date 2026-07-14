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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadRecording = exports.rateCall = exports.getHistory = exports.getCall = exports.endCall = exports.rejectCall = exports.acceptCall = exports.initiateCall = void 0;
const Call_js_1 = __importDefault(require("../models/Call.js"));
const callService = __importStar(require("../services/call.service.js"));
const response_js_1 = require("../utils/response.js");
const asyncHandler_js_1 = require("../utils/asyncHandler.js");
const params_js_1 = require("../utils/params.js");
const pagination_js_1 = require("../utils/pagination.js");
const Expert_js_1 = __importDefault(require("../models/Expert.js"));
exports.initiateCall = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const result = await callService.initiateCall(req.user._id.toString(), req.body.expertId);
    return (0, response_js_1.sendCreated)(res, {
        call: result.call,
        agoraToken: result.agoraToken,
        channelName: result.channelName,
    }, "Call initiated");
});
exports.acceptCall = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const result = await callService.acceptCall((0, params_js_1.getParam)(req, "id"), req.user._id.toString());
    return (0, response_js_1.sendSuccess)(res, {
        call: result.call,
        agoraToken: result.agoraToken,
        channelName: result.channelName,
    }, "Call accepted");
});
exports.rejectCall = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const call = await callService.rejectCall((0, params_js_1.getParam)(req, "id"), req.user._id.toString());
    return (0, response_js_1.sendSuccess)(res, call, "Call rejected");
});
exports.endCall = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const expert = await Expert_js_1.default.findOne({ userId: req.user._id });
    const reason = expert ? "expert_ended" : "user_ended";
    const call = await callService.endCall((0, params_js_1.getParam)(req, "id"), req.user._id.toString(), reason);
    return (0, response_js_1.sendSuccess)(res, call, "Call ended");
});
exports.getCall = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const call = await Call_js_1.default.findById((0, params_js_1.getParam)(req, "id"))
        .populate("userId", "name avatar")
        .populate({ path: "expertId", populate: { path: "userId", select: "name avatar" } });
    return (0, response_js_1.sendSuccess)(res, call);
});
exports.getHistory = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const expert = await Expert_js_1.default.findOne({ userId: req.user._id });
    const filter = expert
        ? { expertId: expert._id }
        : { userId: req.user._id };
    const result = await (0, pagination_js_1.paginate)({
        model: Call_js_1.default,
        filter,
        query: req.query,
        populate: expert
            ? { path: "userId", select: "name avatar" }
            : { path: "expertId", populate: { path: "userId", select: "name avatar" } },
        sort: { createdAt: -1 },
    });
    return (0, response_js_1.sendPaginated)(res, result);
});
exports.rateCall = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const call = await callService.rateCall((0, params_js_1.getParam)(req, "id"), req.user._id.toString(), req.body.rating, req.body.review);
    return (0, response_js_1.sendSuccess)(res, call, "Call rated successfully");
});
exports.uploadRecording = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    if (!req.file) {
        return (0, response_js_1.sendSuccess)(res, null, "No recording file");
    }
    const call = await callService.saveCallRecording((0, params_js_1.getParam)(req, "id"), req.user._id.toString(), req.file.buffer);
    return (0, response_js_1.sendSuccess)(res, call, "Recording saved");
});
//# sourceMappingURL=call.controller.js.map