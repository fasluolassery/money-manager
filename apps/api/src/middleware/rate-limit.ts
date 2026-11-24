import type { NextFunction, Request, Response } from "express";
import { ipKeyGenerator, type RateLimitRequestHandler, rateLimit } from "express-rate-limit";
import { RateLimitedError } from "../errors.js";

export const API_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;

export type RateLimitOptions = {
  windowMs: number;
  limit: number;
};

/**
 * Counts requests per signed-in user, or per IP address when signed out, and answers
 * `429 RATE_LIMITED` in the envelope (DESIGN 7.4, FR-10.10). Used for the `/api/v1`
 * default and for tighter per-route limits on top of it.
 */
export function createRateLimit({ windowMs, limit }: RateLimitOptions): RateLimitRequestHandler {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    keyGenerator: (req: Request) => req.userId ?? ipKeyGenerator(req.ip ?? ""),
    handler: (_req: Request, _res: Response, next: NextFunction) => {
      next(new RateLimitedError());
    },
  });
}
