"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.notFoundHandler = void 0;
const http_status_codes_1 = require("http-status-codes");
const AppError_js_1 = require("../utils/AppError.js");
const response_js_1 = require("../utils/response.js");
const notFoundHandler = (_req, res) => {
    return (0, response_js_1.sendError)(res, "Route not found", http_status_codes_1.StatusCodes.NOT_FOUND);
};
exports.notFoundHandler = notFoundHandler;
const errorHandler = (err, _req, res, _next) => {
    if (err instanceof AppError_js_1.ValidationError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            errors: err.errors,
        });
    }
    if (err instanceof AppError_js_1.AppError) {
        return (0, response_js_1.sendError)(res, err.message, err.statusCode);
    }
    // Mongoose validation error
    if (err.name === "ValidationError") {
        return (0, response_js_1.sendError)(res, err.message, http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    // Mongoose duplicate key
    if (err.code === 11000) {
        return (0, response_js_1.sendError)(res, "Duplicate field value", http_status_codes_1.StatusCodes.CONFLICT);
    }
    // JWT errors
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
        return (0, response_js_1.sendError)(res, "Invalid or expired token", http_status_codes_1.StatusCodes.UNAUTHORIZED);
    }
    console.error("Unhandled error:", err);
    return (0, response_js_1.sendError)(res, process.env.NODE_ENV === "production" ? "Internal server error" : err.message, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR);
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map