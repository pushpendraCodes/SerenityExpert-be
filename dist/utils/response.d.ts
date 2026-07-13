import { Response } from "express";
import type { PaginatedResult } from "../types/index.js";
/**
 * Send a standardized success JSON response.
 */
export declare function sendSuccess<T>(res: Response, data: T, message?: string, statusCode?: number): Response;
/**
 * Send a standardized created response (201).
 */
export declare function sendCreated<T>(res: Response, data: T, message?: string): Response;
/**
 * Send a standardized error JSON response.
 */
export declare function sendError(res: Response, message?: string, statusCode?: number, error?: string): Response;
/**
 * Send a paginated success JSON response.
 */
export declare function sendPaginated<T>(res: Response, result: PaginatedResult<T>, message?: string): Response;
//# sourceMappingURL=response.d.ts.map