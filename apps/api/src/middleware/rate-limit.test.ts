import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { RateLimitedError } from "../errors.js";
import { errorHandler } from "./error-handler.js";
import { createApiRateLimiter, perUserLimit } from "./rate-limit.js";

function makeApp(limit: ReturnType<typeof createApiRateLimiter | typeof perUserLimit>) {
  const app = express();
  app.set("trust proxy", 1);
  app.use((_req, _res, next) => {
    // Simulate a resolved userId so keying is consistent in tests.
    (_req as typeof _req & { userId?: string }).userId = "test-user";
    next();
  });
  app.use(limit);
  app.get("/test", (_req, res) => res.json({ ok: true }));
  app.use(errorHandler);
  return app;
}

describe("createApiRateLimiter", () => {
  it("[FR-10.10] allows requests under the limit", async () => {
    const app = makeApp(createApiRateLimiter());
    const res = await request(app).get("/test");
    expect(res.status).toBe(200);
  });
});

describe("perUserLimit", () => {
  it("[FR-10.10] blocks requests that exceed the per-user limit", async () => {
    // limit=1 so the second request trips the guard.
    const app = makeApp(perUserLimit(1, 60_000));

    await request(app).get("/test").expect(200);
    const res = await request(app).get("/test");
    expect(res.status).toBe(429);
    expect(res.body).toMatchObject({
      success: false,
      error: { code: "RATE_LIMITED" },
    });
  });

  it("[FR-10.10] the envelope error matches RateLimitedError code", () => {
    expect(new RateLimitedError().code).toBe("RATE_LIMITED");
    expect(new RateLimitedError().status).toBe(429);
  });
});
