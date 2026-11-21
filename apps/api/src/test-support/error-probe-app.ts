import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { VALIDATION_MESSAGES } from "@money-manager/shared";
import type { Application } from "express";
import pino from "pino";
import { z } from "zod";
import { createApp } from "../app.js";
import type { Config } from "../config.js";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  PayloadTooLargeError,
  RateLimitedError,
  RuleViolationError,
  StaleRecordError,
  UnauthenticatedError,
  ValidationError,
} from "../errors.js";
import { validate } from "../middleware/validate.js";
import { sendSuccess } from "../respond.js";

export const ERROR_TEST_CONFIG: Config = {
  NODE_ENV: "test",
  PORT: 3000,
  APP_URL: "http://localhost:3000",
  LOG_LEVEL: "silent",
  MONGODB_URI: "mongodb://localhost:27017",
};

export const nameBodySchema = z
  .object({
    name: z.string({ error: VALIDATION_MESSAGES.invalid }),
  })
  .strict();

export function createTempWebDist(): string {
  const webDistPath = mkdtempSync(join(tmpdir(), "api-errors-dist-"));
  mkdirSync(join(webDistPath, "assets"), { recursive: true });
  writeFileSync(join(webDistPath, "index.html"), "<!DOCTYPE html><html></html>");
  return webDistPath;
}

export function registerProbeRoutes(app: Application): void {
  app.post("/api/probe/validate", validate({ body: nameBodySchema }), (req, res) => {
    sendSuccess(res, req.body);
  });

  app.get("/api/probe/validation", (_req, _res, next) => {
    next(new ValidationError([{ field: "amount", message: "Amount must be more than ₹0" }]));
  });
  app.get("/api/probe/unauthenticated", (_req, _res, next) => {
    next(new UnauthenticatedError());
  });
  app.get("/api/probe/forbidden", (_req, _res, next) => {
    next(new ForbiddenError());
  });
  app.get("/api/probe/not-found", (_req, _res, next) => {
    next(new NotFoundError());
  });
  app.get("/api/probe/conflict", (_req, _res, next) => {
    next(new ConflictError("A category called Food already exists"));
  });
  app.get("/api/probe/stale", (_req, _res, next) => {
    next(new StaleRecordError());
  });
  app.get("/api/probe/payload", (_req, _res, next) => {
    next(new PayloadTooLargeError());
  });
  app.get("/api/probe/rule", (_req, _res, next) => {
    next(new RuleViolationError());
  });
  app.get("/api/probe/rate", (_req, _res, next) => {
    next(new RateLimitedError());
  });
  app.get("/api/probe/async-throw", async () => {
    throw new ConflictError("async boom");
  });
  app.get("/api/probe/raw-error", (_req, _res, next) => {
    next(new Error("mongodb E11000 duplicate key secret-token-xyz"));
  });
}

export function createErrorProbeApp(logLines?: string[]): {
  app: Application;
  webDistPath: string;
} {
  const webDistPath = createTempWebDist();
  const logger = pino(
    { level: logLines ? "error" : "silent" },
    logLines
      ? {
          write(line: string) {
            logLines.push(line);
          },
        }
      : undefined,
  );
  const app = createApp(ERROR_TEST_CONFIG, logger, webDistPath, {
    pingDb: async () => undefined,
    registerApiRoutes: registerProbeRoutes,
  });
  return { app, webDistPath };
}
