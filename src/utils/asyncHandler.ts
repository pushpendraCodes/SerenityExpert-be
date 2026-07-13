import { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Wraps an async Express route handler to automatically catch errors
 * and forward them to the global error handler.
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
