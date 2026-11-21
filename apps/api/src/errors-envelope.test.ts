import { rmSync } from "node:fs";
import { ERROR_MESSAGES } from "@money-manager/shared";
import type { Application } from "express";
import pino from "pino";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { validate } from "./middleware/validate.js";
import { sendSuccess } from "./respond.js";
import {
  createErrorProbeApp,
  createTempWebDist,
  ERROR_TEST_CONFIG,
  nameBodySchema,
} from "./test-support/error-probe-app.js";

function expectFailure(
  res: request.Response,
  status: number,
  code: keyof typeof ERROR_MESSAGES,
  message: string,
): void {
  expect(res.status).toBe(status);
  expect(res.body.success).toBe(false);
  expect(res.body.error.code).toBe(code);
  expect(res.body.error.message).toBe(message);
  expect(res.body.error.requestId).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  );
  expect(res.body.error).not.toHaveProperty("stack");
  expect(JSON.stringify(res.body)).not.toMatch(/E11000|secret-token|at Object/);
}

describe("AppError subclasses → envelope", () => {
  let app: Application;
  let webDistPath: string;

  beforeAll(() => {
    ({ app, webDistPath } = createErrorProbeApp());
  });

  afterAll(() => {
    rmSync(webDistPath, { recursive: true, force: true });
  });

  it("maps each AppError subclass to status, code and envelope shape", async () => {
    const cases = [
      ["/api/probe/validation", 400, "VALIDATION_ERROR", ERROR_MESSAGES.VALIDATION_ERROR],
      ["/api/probe/unauthenticated", 401, "UNAUTHENTICATED", ERROR_MESSAGES.UNAUTHENTICATED],
      ["/api/probe/forbidden", 403, "FORBIDDEN", ERROR_MESSAGES.FORBIDDEN],
      ["/api/probe/not-found", 404, "NOT_FOUND", ERROR_MESSAGES.NOT_FOUND],
      ["/api/probe/conflict", 409, "CONFLICT", "A category called Food already exists"],
      ["/api/probe/stale", 409, "STALE_RECORD", ERROR_MESSAGES.STALE_RECORD],
      ["/api/probe/payload", 413, "PAYLOAD_TOO_LARGE", ERROR_MESSAGES.PAYLOAD_TOO_LARGE],
      ["/api/probe/rule", 422, "RULE_VIOLATION", ERROR_MESSAGES.RULE_VIOLATION],
      ["/api/probe/rate", 429, "RATE_LIMITED", ERROR_MESSAGES.RATE_LIMITED],
    ] as const;

    for (const [path, status, code, message] of cases) {
      const res = await request(app).get(path);
      expectFailure(res, status, code, message);
    }

    const validation = await request(app).get("/api/probe/validation");
    expect(validation.body.error.details).toEqual([
      { field: "amount", message: "Amount must be more than ₹0" },
    ]);
  });
});

describe("validate middleware", () => {
  let app: Application;
  let webDistPath: string;

  beforeAll(() => {
    ({ app, webDistPath } = createErrorProbeApp());
  });

  afterAll(() => {
    rmSync(webDistPath, { recursive: true, force: true });
  });

  it("returns 400 with one details entry per invalid Zod field", async () => {
    const res = await request(app).post("/api/probe/validate").send({});
    expectFailure(res, 400, "VALIDATION_ERROR", ERROR_MESSAGES.VALIDATION_ERROR);
    expect(res.body.error.details).toEqual([
      expect.objectContaining({ field: "name", message: expect.any(String) }),
    ]);
  });

  it("rejects operator-shaped values and unknown keys before the handler runs", async () => {
    let handlerRan = false;
    const dist = createTempWebDist();
    const probingApp = createApp(ERROR_TEST_CONFIG, pino({ level: "silent" }), dist, {
      pingDb: async () => undefined,
      registerApiRoutes(inner) {
        inner.post("/api/probe/strict", validate({ body: nameBodySchema }), (req, res) => {
          handlerRan = true;
          sendSuccess(res, req.body);
        });
      },
    });

    const operatorShaped = await request(probingApp)
      .post("/api/probe/strict")
      .send({ name: { $gt: "" } });
    expect(operatorShaped.status).toBe(400);
    expect(operatorShaped.body.error.code).toBe("VALIDATION_ERROR");
    expect(handlerRan).toBe(false);

    const unknownKey = await request(probingApp)
      .post("/api/probe/strict")
      .send({ name: "ok", extra: true });
    expect(unknownKey.status).toBe(400);
    expect(unknownKey.body.error.code).toBe("VALIDATION_ERROR");
    expect(handlerRan).toBe(false);

    rmSync(dist, { recursive: true, force: true });
  });

  it("sendSuccess wraps data in the success envelope", async () => {
    const res = await request(app).post("/api/probe/validate").send({ name: "Save" });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: { name: "Save" } });
  });
});

describe("error middleware edge cases", () => {
  let app: Application;
  let webDistPath: string;
  let logLines: string[];

  beforeAll(() => {
    logLines = [];
    ({ app, webDistPath } = createErrorProbeApp(logLines));
  });

  afterAll(() => {
    rmSync(webDistPath, { recursive: true, force: true });
  });

  it("returns 500 with catalogue message and request id; logs the full error; no leakage", async () => {
    logLines.length = 0;
    const res = await request(app).get("/api/probe/raw-error");
    expectFailure(res, 500, "INTERNAL_ERROR", ERROR_MESSAGES.INTERNAL_ERROR);
    expect(JSON.stringify(res.body)).not.toContain("secret-token-xyz");
    expect(JSON.stringify(res.body)).not.toContain("E11000");
    expect(logLines.join("\n")).toContain("secret-token-xyz");
  });

  it("handles an async route throw without a wrapper (Express 5)", async () => {
    const res = await request(app).get("/api/probe/async-throw");
    expectFailure(res, 409, "CONFLICT", "async boom");
  });

  it("maps invalid JSON to 400 and a 101 KB body to 413 with catalogue messages", async () => {
    const invalidJson = await request(app)
      .post("/api/probe/validate")
      .set("Content-Type", "application/json")
      .send("{not-json");
    expectFailure(invalidJson, 400, "VALIDATION_ERROR", ERROR_MESSAGES.VALIDATION_ERROR);

    const tooLarge = await request(app)
      .post("/api/probe/validate")
      .set("Content-Type", "application/json")
      .send(`{"name":"${"x".repeat(101 * 1024)}"}`);
    expectFailure(tooLarge, 413, "PAYLOAD_TOO_LARGE", ERROR_MESSAGES.PAYLOAD_TOO_LARGE);
  });

  it("returns 404 NOT_FOUND envelope for unknown /api routes", async () => {
    const res = await request(app).get("/api/does-not-exist");
    expectFailure(res, 404, "NOT_FOUND", ERROR_MESSAGES.NOT_FOUND);
  });
});
