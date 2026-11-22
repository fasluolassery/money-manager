import { randomBytes, randomUUID } from "node:crypto";
import { makeSignature } from "better-auth/crypto";
import type { ObjectId } from "mongodb";
import pino from "pino";
import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { createApp } from "../app.js";
import { createAppContainer } from "../container.js";
import {
  type ApiTestContext,
  createApiTestContext,
  createTempWebDist,
} from "../test-support/api-app.js";
import { createTestSession } from "../test-support/session-helper.js";

/** Build an app + container backed by the same DB handle as ctx. */
async function createAuthApp(ctx: ApiTestContext) {
  const container = createAppContainer({
    config: ctx.config,
    logger: pino({ level: "silent" }),
    dbHandle: ctx.db,
  });
  const dist = createTempWebDist();
  return createApp(ctx.config, pino({ level: "silent" }), dist, {
    pingDb: () => ctx.db.ping(),
    container,
  });
}

let ctx: ApiTestContext;

beforeAll(async () => {
  ctx = await createApiTestContext();
});

afterAll(async () => {
  await ctx.close();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("Session cookie authentication", () => {
  it("[FR-10.8] returns 401 on /api/v1 when no session cookie is present", async () => {
    const app = await createAuthApp(ctx);
    const res = await request(app).get("/api/v1/users/me");
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ success: false, error: { code: "UNAUTHENTICATED" } });
  });

  it("[FR-10.8] returns a non-401 on /api/v1 when a valid signed session cookie is provided", async () => {
    const app = await createAuthApp(ctx);
    const { cookieHeader } = await createTestSession(ctx.db.db, ctx.config.BETTER_AUTH_SECRET);
    const res = await request(app).get("/api/v1/users/me").set("Cookie", cookieHeader);
    // Profile may not exist yet — 404 is fine; 401 would mean auth failed.
    expect(res.status).not.toBe(401);
  });

  it("[FR-10.8] returns 401 when the session has already expired", async () => {
    const app = await createAuthApp(ctx);
    const userId = randomUUID().replaceAll("-", "");
    const token = randomBytes(24).toString("hex");
    const now = new Date();
    const expiredAt = new Date(now.getTime() - 1000);

    await ctx.db.db.collection("user").insertOne({
      _id: userId as unknown as ObjectId,
      name: "Expired User",
      email: `expired-${userId}@example.com`,
      emailVerified: false,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.db.collection("session").insertOne({
      _id: randomUUID().replaceAll("-", "") as unknown as ObjectId,
      token,
      userId,
      expiresAt: expiredAt,
      ipAddress: "",
      userAgent: "",
      createdAt: now,
      updatedAt: now,
    });

    const signature = await makeSignature(token, ctx.config.BETTER_AUTH_SECRET);
    const cookieHeader = `better-auth.session_token=${token}.${signature}`;

    const res = await request(app).get("/api/v1/users/me").set("Cookie", cookieHeader);
    expect(res.status).toBe(401);
  });
});

describe("Session helper", () => {
  it("[FR-10.8] createTestSession inserts user and session documents with ~30-day expiry", async () => {
    const { userId, cookieHeader } = await createTestSession(
      ctx.db.db,
      ctx.config.BETTER_AUTH_SECRET,
    );

    expect(userId).toBeTruthy();
    expect(cookieHeader).toMatch(/^better-auth\.session_token=.+\..+$/);

    const userDoc = await ctx.db.db
      .collection("user")
      .findOne({ _id: userId as unknown as ObjectId });
    expect(userDoc).not.toBeNull();

    const sessionDoc = await ctx.db.db.collection("session").findOne({ userId });
    expect(sessionDoc).not.toBeNull();

    const expiresAt = sessionDoc?.expiresAt as Date;
    expect(expiresAt).toBeInstanceOf(Date);
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now() + thirtyDays - 60_000);
  });
});
