import { Request } from "express";

/** Safely extract a route param as a string. */
export function getParam(req: Request, name: string): string {
  const value = req.params[name];
  return Array.isArray(value) ? value[0] : value;
}

/** Safely extract a query param as a string. */
export function getQueryParam(req: Request, name: string): string | undefined {
  const value = req.query[name];
  if (Array.isArray(value)) return String(value[0]);
  if (value === undefined) return undefined;
  return String(value);
}
