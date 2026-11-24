import type { UserId } from "@money-manager/shared";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { AuthAdapter } from "../auth/auth-adapter.js";
import { UnauthenticatedError } from "../errors.js";

declare global {
  // Express's documented way to type request properties set by middleware.
  namespace Express {
    interface Request {
      /** Set by `loadSession` from a valid session; services receive it as `userId` (DESIGN 4.5). */
      userId?: UserId;
    }
  }
}

/**
 * Reads the session through the auth adapter and puts the user id on the request.
 * Runs before the rate limiter so it can count per user; it rejects nothing itself.
 * A refreshed or cleared session cookie is passed on to the browser (DESIGN 7.3).
 */
export function createLoadSession(authAdapter: AuthAdapter): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { userId, setCookies } = await authAdapter.getSession(req.headers);
    if (setCookies.length > 0) res.append("Set-Cookie", setCookies);
    if (userId !== null) req.userId = userId;
    next();
  };
}

/** `401 UNAUTHENTICATED` unless `loadSession` found a user (DESIGN 7.4, FR-10.7). */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  next(req.userId === undefined ? new UnauthenticatedError() : undefined);
}
