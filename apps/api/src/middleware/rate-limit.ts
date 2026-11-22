import type { NextFunction, Response } from "express";
import rateLimit from "express-rate-limit";
import { RateLimitedError } from "../errors.js";

/** 300 requests per 5 min keyed by userId, falling back to IP (DESIGN D-48, FR-10.10). */
export function createApiRateLimiter() {
  return rateLimit({
    windowMs: 5 * 60 * 1000,
    limit: 300,
    keyGenerator: (req) => req.userId ?? req.ip ?? "unknown",
    validate: { keyGeneratorIpFallback: false },
    handler: (_req, _res: Response, next: NextFunction) => next(new RateLimitedError()),
    standardHeaders: "draft-7",
    legacyHeaders: false,
  });
}

/** Tighter per-user limit for a specific route (DESIGN D-48, FR-10.10). */
export function perUserLimit(limit: number, windowMs = 60 * 60 * 1000) {
  return rateLimit({
    windowMs,
    limit,
    keyGenerator: (req) => req.userId ?? req.ip ?? "unknown",
    validate: { keyGeneratorIpFallback: false },
    handler: (_req, _res: Response, next: NextFunction) => next(new RateLimitedError()),
    standardHeaders: "draft-7",
    legacyHeaders: false,
  });
}
