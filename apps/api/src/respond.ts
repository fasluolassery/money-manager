import type { Response } from "express";

/**
 * Success envelope helper for #9 (DESIGN 6.2).
 * Schema-checked `respond(res, schema, data)` arrives in issue #66 (DESIGN 6.6, D-40).
 */
export function sendSuccess<T>(res: Response, data: T, status = 200): void {
  res.status(status).json({ success: true, data });
}
