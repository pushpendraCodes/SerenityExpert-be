import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { ValidationError } from "../utils/AppError.js";

type RequestPart = "body" | "query" | "params";

/**
 * Express 5 exposes req.query / req.params as getter-only.
 * Reassign via defineProperty after Zod parsing.
 */
function assignRequestPart(req: Request, part: RequestPart, value: unknown): void {
  if (part === "body") {
    req.body = value;
    return;
  }

  Object.defineProperty(req, part, {
    value,
    writable: true,
    configurable: true,
    enumerable: true,
  });
}

export const validate = (schema: ZodSchema, part: RequestPart = "body") => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[part]);
      assignRequestPart(req, part, parsed);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors: Record<string, string[]> = {};
        err.errors.forEach((e) => {
          const key = e.path.join(".") || "root";
          if (!errors[key]) errors[key] = [];
          errors[key].push(e.message);
        });
        throw new ValidationError("Validation failed", errors);
      }
      throw err;
    }
  };
};
