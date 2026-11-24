import type { NextFunction, Request, RequestHandler, Response } from "express";
import { ForbiddenError } from "../errors.js";

const CHECKED_METHODS = new Set(["POST", "PATCH", "DELETE"]);

/**
 * A `POST`, `PATCH` or `DELETE` must carry the app's own `Origin`; a missing or
 * foreign one gets `403 FORBIDDEN` (DESIGN 7.4, D-47).
 */
export function createOriginCheck(appUrl: string): RequestHandler {
  const appOrigin = new URL(appUrl).origin;
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!CHECKED_METHODS.has(req.method) || req.get("origin") === appOrigin) {
      next();
      return;
    }
    next(new ForbiddenError());
  };
}
