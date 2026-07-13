"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSuccess = sendSuccess;
exports.sendCreated = sendCreated;
exports.sendError = sendError;
exports.sendPaginated = sendPaginated;
const http_status_codes_1 = require("http-status-codes");
/**
 * Send a standardized success JSON response.
 */
function sendSuccess(res, data, message = "Success", statusCode = http_status_codes_1.StatusCodes.OK) {
    const body = {
        success: true,
        message,
        data,
    };
    return res.status(statusCode).json(body);
}
/**
 * Send a standardized created response (201).
 */
function sendCreated(res, data, message = "Created successfully") {
    return sendSuccess(res, data, message, http_status_codes_1.StatusCodes.CREATED);
}
/**
 * Send a standardized error JSON response.
 */
function sendError(res, message = "Internal server error", statusCode = http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, error) {
    const body = {
        success: false,
        message,
        error,
    };
    return res.status(statusCode).json(body);
}
/**
 * Send a paginated success JSON response.
 */
function sendPaginated(res, result, message = "Success") {
    return res.status(http_status_codes_1.StatusCodes.OK).json({
        success: true,
        message,
        ...result,
    });
}
//# sourceMappingURL=response.js.map