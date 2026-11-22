import type { NextFunction, Request, Response } from "express";
import type { AuthAdapter } from "../auth/index.js";
import { UnauthenticatedError } from "../errors.js";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export function createRequireAuth({ authAdapter }: { authAdapter: AuthAdapter }) {
  return async function requireAuth(req: Request, _res: Response, next: NextFunction) {
    let userId: string | null;
    try {
      userId = await authAdapter.getUserId(req);
    } catch (err) {
      next(err);
      return;
    }
    if (userId === null) {
      next(new UnauthenticatedError());
      return;
    }
    req.userId = userId;
    next();
  };
}
