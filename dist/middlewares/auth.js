"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.requireAdmin = exports.requireApprovedExpert = exports.requireExpert = exports.requireUser = exports.authenticate = void 0;
const User_js_1 = __importDefault(require("../models/User.js"));
const Expert_js_1 = __importDefault(require("../models/Expert.js"));
const token_js_1 = require("../utils/token.js");
const AppError_js_1 = require("../utils/AppError.js");
const index_js_1 = require("../types/index.js");
const asyncHandler_js_1 = require("../utils/asyncHandler.js");
exports.authenticate = (0, asyncHandler_js_1.asyncHandler)(async (req, _res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        throw new AppError_js_1.AuthError();
    }
    const token = authHeader.split(" ")[1];
    const decoded = (0, token_js_1.verifyAccessToken)(token);
    const user = await User_js_1.default.findById(decoded.userId);
    if (!user || user.isBlocked) {
        throw new AppError_js_1.AuthError("Account not found or blocked");
    }
    req.user = user;
    next();
});
exports.requireUser = (0, asyncHandler_js_1.asyncHandler)(async (req, _res, next) => {
    if (!req.user)
        throw new AppError_js_1.AuthError();
    next();
});
exports.requireExpert = (0, asyncHandler_js_1.asyncHandler)(async (req, _res, next) => {
    if (!req.user)
        throw new AppError_js_1.AuthError();
    const expert = await Expert_js_1.default.findOne({ userId: req.user._id });
    if (!expert) {
        throw new AppError_js_1.ForbiddenError("Expert profile required");
    }
    req.expert = expert;
    next();
});
exports.requireApprovedExpert = (0, asyncHandler_js_1.asyncHandler)(async (req, _res, next) => {
    if (!req.expert?.isApproved) {
        throw new AppError_js_1.ForbiddenError("Expert account not approved");
    }
    next();
});
exports.requireAdmin = (0, asyncHandler_js_1.asyncHandler)(async (req, _res, next) => {
    if (!req.user || req.user.role !== index_js_1.UserRole.ADMIN) {
        throw new AppError_js_1.ForbiddenError("Admin access required");
    }
    next();
});
exports.optionalAuth = (0, asyncHandler_js_1.asyncHandler)(async (req, _res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        return next();
    }
    try {
        const token = authHeader.split(" ")[1];
        const decoded = (0, token_js_1.verifyAccessToken)(token);
        const user = await User_js_1.default.findById(decoded.userId);
        if (user && !user.isBlocked) {
            req.user = user;
        }
    }
    catch {
        // Ignore invalid token for optional auth
    }
    next();
});
//# sourceMappingURL=auth.js.map