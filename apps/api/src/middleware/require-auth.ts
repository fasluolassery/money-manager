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
      /** The signed-in user's name and email, set with `userId` (only `GET /me` returns them). */
      identity?: { name: string; email: string };
    }
  }
}

/** What `requireAuth` needs from the users service, so middleware doesn't import a feature. */
export type ProfileGuard = {
  ensureProfile: (userId: string) => Promise<void>;
};

/**
 * Reads the session through the auth adapter and puts the user id on the request.
 * Runs before the rate limiter so it can count per user; it rejects nothing itself.
 * A refreshed or cleared session cookie is passed on to the browser (DESIGN 7.3).
 */
export function createLoadSession(authAdapter: AuthAdapter): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { userId, identity, setCookies } = await authAdapter.getSession(req.headers);
    if (setCookies.length > 0) res.append("Set-Cookie", setCookies);
    if (userId !== null) req.userId = userId;
    if (identity !== null) req.identity = identity;
    next();
  };
}

/**
 * `401 UNAUTHENTICATED` unless `loadSession` found a user (DESIGN 7.4, FR-10.7). For a
 * signed-in user it also calls `ensureProfile`, so a failed after-sign-up hook can never
 * leave anyone without a profile (DESIGN 7.2, FR-13.1).
 */
export function createRequireAuth(profiles: ProfileGuard): RequestHandler {
  return async (req: Request, _res: Response, next: NextFunction) => {
    if (req.userId === undefined) {
      next(new UnauthenticatedError());
      return;
    }
    await profiles.ensureProfile(req.userId);
    next();
  };
}

/** The signed-in user a route works for; only valid behind `requireAuth`. */
export function getSessionUser(req: Request): {
  userId: UserId;
  identity: { name: string; email: string };
} {
  if (req.userId === undefined || req.identity === undefined) throw new UnauthenticatedError();
  return { userId: req.userId, identity: req.identity };
}
