"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InsufficientBalanceError = exports.TooManyRequestsError = exports.ConflictError = exports.NotFoundError = exports.ForbiddenError = exports.AuthError = exports.ValidationError = exports.AppError = void 0;
const http_status_codes_1 = require("http-status-codes");
class AppError extends Error {
    statusCode;
    isOperational;
    constructor(message, statusCode = http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Object.setPrototypeOf(this, AppError.prototype);
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class ValidationError extends AppError {
    errors;
    constructor(message, errors = {}) {
        super(message, http_status_codes_1.StatusCodes.BAD_REQUEST);
        this.errors = errors;
        Object.setPrototypeOf(this, ValidationError.prototype);
    }
}
exports.ValidationError = ValidationError;
class AuthError extends AppError {
    constructor(message = "Authentication required") {
        super(message, http_status_codes_1.StatusCodes.UNAUTHORIZED);
        Object.setPrototypeOf(this, AuthError.prototype);
    }
}
exports.AuthError = AuthError;
class ForbiddenError extends AppError {
    constructor(message = "Access denied") {
        super(message, http_status_codes_1.StatusCodes.FORBIDDEN);
        Object.setPrototypeOf(this, ForbiddenError.prototype);
    }
}
exports.ForbiddenError = ForbiddenError;
class NotFoundError extends AppError {
    constructor(resource = "Resource") {
        super(`${resource} not found`, http_status_codes_1.StatusCodes.NOT_FOUND);
        Object.setPrototypeOf(this, NotFoundError.prototype);
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends AppError {
    constructor(message = "Resource already exists") {
        super(message, http_status_codes_1.StatusCodes.CONFLICT);
        Object.setPrototypeOf(this, ConflictError.prototype);
    }
}
exports.ConflictError = ConflictError;
class TooManyRequestsError extends AppError {
    constructor(message = "Too many requests, please try again later") {
        super(message, http_status_codes_1.StatusCodes.TOO_MANY_REQUESTS);
        Object.setPrototypeOf(this, TooManyRequestsError.prototype);
    }
}
exports.TooManyRequestsError = TooManyRequestsError;
class InsufficientBalanceError extends AppError {
    constructor(message = "Insufficient wallet balance") {
        super(message, http_status_codes_1.StatusCodes.PAYMENT_REQUIRED);
        Object.setPrototypeOf(this, InsufficientBalanceError.prototype);
    }
}
exports.InsufficientBalanceError = InsufficientBalanceError;
//# sourceMappingURL=AppError.js.map