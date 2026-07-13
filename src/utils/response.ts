import { Response } from "express";
import { StatusCodes } from "http-status-codes";
import type { ApiResponse, PaginatedResult } from "../types/index.js";

/**
 * Send a standardized success JSON response.
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message = "Success",
  statusCode: number = StatusCodes.OK
): Response {
  const body: ApiResponse<T> = {
    success: true,
    message,
    data,
  };
  return res.status(statusCode).json(body);
}

/**
 * Send a standardized created response (201).
 */
export function sendCreated<T>(res: Response, data: T, message = "Created successfully"): Response {
  return sendSuccess(res, data, message, StatusCodes.CREATED);
}

/**
 * Send a standardized error JSON response.
 */
export function sendError(
  res: Response,
  message = "Internal server error",
  statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR,
  error?: string
): Response {
  const body: ApiResponse = {
    success: false,
    message,
    error,
  };
  return res.status(statusCode).json(body);
}

/**
 * Send a paginated success JSON response.
 */
export function sendPaginated<T>(
  res: Response,
  result: PaginatedResult<T>,
  message = "Success"
): Response {
  return res.status(StatusCodes.OK).json({
    success: true,
    message,
    ...result,
  });
}
