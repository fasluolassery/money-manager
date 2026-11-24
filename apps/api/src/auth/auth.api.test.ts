import { ERROR_MESSAGES } from "@money-manager/shared";
import pino from "pino";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { type AuthTestContext, createAuthTestContext } from "../test-support/auth-app.js";
import { buildAuthOptions } from "./auth.js";
import type { AuthCore } from "./auth-adapter.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const SESSION_MS = 30 * DAY_MS;

let ctx: AuthTestContext;

afterEach(async () => {
  await ctx.close();
});

function sessions(context: AuthTestContext) {
  return context.db.db.collection<{ token: string; expiresAt: Date }>("session");
}

/** Pretends the session was last extended `ageMs` ago: its expiry is that much closer. */
async function ageSession(token: string, ageMs: number): Promise<Date> {
  const expiresAt = new Date(Date.now() + SESSION_MS - ageMs);
  await sessions(ctx).updateOne({ token }, { $set: { expiresAt } });
  return expiresAt;
}

async function expiryOf(token: string): Promise<Date | undefined> {
  return (await sessions(ctx).findOne({ token }))?.expiresAt;
}

describe("requireAuth on /api/v1", () => {
  beforeEach(async () => {
    ctx = await createAuthTestContext();
  });

  it("[FR-10.7] [FR-2.4] answers 401 in the envelope without a session", async () => {
    const res = await request(ctx.app).get("/api/v1/anything");
    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      success: false,
      error: {
        code: "UNAUTHENTICATED",
        message: ERROR_MESSAGES.UNAUTHENTICATED,
        requestId: expect.any(String),
      },
    });
  });

  it("[FR-10.7] answers 401 for a forged session cookie", async () => {
    const res = await request(ctx.app)
      .get("/api/v1/anything")
      .set("Cookie", "better-auth.session_token=forged.value");
    expect(res.status).toBe(401);
  });

  it("[FR-10.7] lets a signed-in request through to the routes", async () => {
    const { cookie } = await ctx.signIn();
    const res = await request(ctx.app).get("/api/v1/anything").set("Cookie", cookie);
    expect(res.status).toBe(404);
  });
});

describe("sliding sessions", () => {
  beforeEach(async () => {
    ctx = await createAuthTestContext();
  });

  it("[FR-10.8] extends a session used more than a day after it was last extended", async () => {
    const { cookie, sessionToken } = await ctx.signIn();
    const before = await ageSession(sessionToken, 2 * DAY_MS);

    const res = await request(ctx.app).get("/api/v1/anything").set("Cookie", cookie);

    expect(res.status).toBe(404);
    const after = await expiryOf(sessionToken);
    expect(after?.getTime()).toBeGreaterThan(before.getTime() + DAY_MS);
    const setCookie = String(res.headers["set-cookie"]);
    expect(setCookie).toContain("session_token=");
    expect(setCookie).toMatch(/HttpOnly/i);
    expect(setCookie).toMatch(/SameSite=Lax/i);
  });

  it("[FR-10.8] doesn't rewrite a session extended less than a day ago", async () => {
    const { cookie, sessionToken } = await ctx.signIn();
    const before = await ageSession(sessionToken, 60 * 60 * 1000);

    const res = await request(ctx.app).get("/api/v1/anything").set("Cookie", cookie);

    expect(res.status).toBe(404);
    expect((await expiryOf(sessionToken))?.getTime()).toBe(before.getTime());
    expect(res.headers["set-cookie"]).toBeUndefined();
  });

  it("[FR-10.8] rejects a session unused for 30 days and clears its cookie", async () => {
    const { cookie, sessionToken } = await ctx.signIn();
    await ageSession(sessionToken, SESSION_MS + 60 * 1000);

    const res = await request(ctx.app).get("/api/v1/anything").set("Cookie", cookie);

    expect(res.status).toBe(401);
    expect(String(res.headers["set-cookie"])).toMatch(/session_token=;|Max-Age=0/);
  });
});

describe("Origin check", () => {
  beforeEach(async () => {
    ctx = await createAuthTestContext();
  });

  it("[FR-10.7] refuses a POST with a foreign Origin with 403", async () => {
    const { cookie } = await ctx.signIn();
    const res = await request(ctx.app)
      .post("/api/v1/anything")
      .set("Cookie", cookie)
      .set("Origin", "https://evil.example");
    expect(res.status).toBe(403);
    expect(res.body.error).toMatchObject({ code: "FORBIDDEN", message: ERROR_MESSAGES.FORBIDDEN });
  });

  it("[FR-10.7] refuses a PATCH or DELETE without an Origin with 403", async () => {
    const { cookie } = await ctx.signIn();
    const patch = await request(ctx.app).patch("/api/v1/anything").set("Cookie", cookie);
    const del = await request(ctx.app).delete("/api/v1/anything").set("Cookie", cookie);
    expect([patch.status, del.status]).toEqual([403, 403]);
  });

  it("[FR-10.7] lets a POST from the app's own origin through", async () => {
    const { cookie } = await ctx.signIn();
    const res = await request(ctx.app)
      .post("/api/v1/anything")
      .set("Cookie", cookie)
      .set("Origin", new URL(ctx.config.APP_URL).origin);
    expect(res.status).toBe(404);
  });
});

describe("rate limits", () => {
  it("[FR-10.10] answers 429 in the envelope past the /api/v1 limit, per IP when signed out", async () => {
    ctx = await createAuthTestContext({ RATE_LIMIT_API: 2 });
    const statuses: number[] = [];
    for (let i = 0; i < 3; i++) {
      statuses.push((await request(ctx.app).get("/api/v1/anything")).status);
    }
    expect(statuses).toEqual([401, 401, 429]);
    const res = await request(ctx.app).get("/api/v1/anything");
    expect(res.body.error).toMatchObject({
      code: "RATE_LIMITED",
      message: ERROR_MESSAGES.RATE_LIMITED,
    });
  });

  it("[FR-10.10] counts each signed-in user separately", async () => {
    ctx = await createAuthTestContext({ RATE_LIMIT_API: 1 });
    const first = await ctx.signIn();
    const second = await ctx.signIn();
    const a1 = await request(ctx.app).get("/api/v1/anything").set("Cookie", first.cookie);
    const a2 = await request(ctx.app).get("/api/v1/anything").set("Cookie", first.cookie);
    const b1 = await request(ctx.app).get("/api/v1/anything").set("Cookie", second.cookie);
    expect([a1.status, a2.status, b1.status]).toEqual([404, 429, 404]);
  });

  it("[FR-10.10] keys Better Auth's limiter by the proxy-derived IP, not headers the client sets", async () => {
    ctx = await createAuthTestContext({ RATE_LIMIT_AUTH: 2 });
    const statuses: number[] = [];
    for (let i = 0; i < 3; i++) {
      const res = await request(ctx.app)
        .get("/api/auth/ok")
        .set("X-Forwarded-For", `10.0.0.${i}, 203.0.113.7`)
        .set("X-App-Client-Ip", `198.51.100.${i}`);
      statuses.push(res.status);
    }
    expect(statuses).toEqual([200, 200, 429]);
  });
});

describe("cookies and failures", () => {
  it("[FR-10.8] marks cookies Secure in production and httpOnly, SameSite=Lax everywhere", async () => {
    ctx = await createAuthTestContext();
    const deps = { logger: pino({ level: "silent" }), db: ctx.db.db, mongoClient: ctx.db.client };
    const production = buildAuthOptions({
      ...deps,
      config: { ...ctx.config, NODE_ENV: "production" },
    });
    const local = buildAuthOptions({ ...deps, config: ctx.config });
    expect(production.advanced.useSecureCookies).toBe(true);
    expect(local.advanced.useSecureCookies).toBe(false);
    expect(production.advanced.defaultCookieAttributes).toEqual({
      httpOnly: true,
      sameSite: "lax",
    });
    expect(production.session.cookieCache.enabled).toBe(false);
  });

  it("[FR-10.7] turns a Better Auth failure into a 500 with only the catalogue message", async () => {
    const failingAuth = {
      handler: async () => new Response(null, { status: 500 }),
      api: {
        getSession: async () => {
          throw new Error("raw Better Auth text: MongoServerError E11000");
        },
      },
    } as unknown as AuthCore;
    ctx = await createAuthTestContext({}, failingAuth);

    const res = await request(ctx.app).get("/api/v1/anything");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: ERROR_MESSAGES.INTERNAL_ERROR,
        requestId: expect.any(String),
      },
    });
    expect(res.text).not.toContain("raw Better Auth text");
  });
});
