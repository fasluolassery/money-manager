import type { NextFunction, Request, Response } from "express";
import { CLIENT_IP_HEADER } from "../auth/auth.js";

/**
 * Overwrites the header Better Auth's rate limiter reads with Express's `req.ip`,
 * which honours exactly one proxy hop (`trust proxy` 1). Whatever the client sent
 * in that header is discarded (DESIGN 7.4).
 */
export function clientIpHeader(req: Request, _res: Response, next: NextFunction): void {
  if (req.ip === undefined) {
    delete req.headers[CLIENT_IP_HEADER];
  } else {
    req.headers[CLIENT_IP_HEADER] = req.ip;
  }
  next();
}
