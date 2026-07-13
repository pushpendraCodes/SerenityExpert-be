import { StatusCodes } from "http-status-codes";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  public readonly errors: Record<string, string[]>;

  constructor(message: string, errors: Record<string, string[]> = {}) {
    super(message, StatusCodes.BAD_REQUEST);
    this.errors = errors;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class AuthError extends AppError {
  constructor(message = "Authentication required") {
    super(message, StatusCodes.UNAUTHORIZED);
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Access denied") {
    super(message, StatusCodes.FORBIDDEN);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, StatusCodes.NOT_FOUND);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource already exists") {
    super(message, StatusCodes.CONFLICT);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = "Too many requests, please try again later") {
    super(message, StatusCodes.TOO_MANY_REQUESTS);
    Object.setPrototypeOf(this, TooManyRequestsError.prototype);
  }
}

export class InsufficientBalanceError extends AppError {
  constructor(message = "Insufficient wallet balance") {
    super(message, StatusCodes.PAYMENT_REQUIRED);
    Object.setPrototypeOf(this, InsufficientBalanceError.prototype);
  }
}
