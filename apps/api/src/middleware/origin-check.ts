import type { NextFunction, Request, Response } from "express";
import type { Config } from "../config.js";
import { ForbiddenError } from "../errors.js";

const MUTATING_METHODS = new Set(["POST", "PATCH", "DELETE"]);

export function createOriginCheck({ config }: { config: Config }) {
  return function originCheck(req: Request, _res: Response, next: NextFunction): void {
    if (!MUTATING_METHODS.has(req.method)) {
      next();
      return;
    }
    if (req.headers.origin !== config.APP_URL) {
      next(new ForbiddenError());
      return;
    }
    next();
  };
}
