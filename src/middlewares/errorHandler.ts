import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { AppError, ValidationError } from "../utils/AppError.js";
import { sendError } from "../utils/response.js";

export const notFoundHandler = (_req: Request, res: Response): Response => {
  return sendError(res, "Route not found", StatusCodes.NOT_FOUND);
};

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response => {
  if (err instanceof ValidationError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
  }

  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode);
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    return sendError(res, err.message, StatusCodes.BAD_REQUEST);
  }

  // Mongoose duplicate key
  if ((err as { code?: number }).code === 11000) {
    return sendError(res, "Duplicate field value", StatusCodes.CONFLICT);
  }

  // JWT errors
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return sendError(res, "Invalid or expired token", StatusCodes.UNAUTHORIZED);
  }

  console.error("Unhandled error:", err);
  return sendError(
    res,
    process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
    StatusCodes.INTERNAL_SERVER_ERROR
  );
};
