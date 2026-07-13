import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
type RequestPart = "body" | "query" | "params";
export declare const validate: (schema: ZodSchema, part?: RequestPart) => (req: Request, _res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=validate.d.ts.map