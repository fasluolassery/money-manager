import { ERROR_MESSAGES } from "@money-manager/shared";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { type AuthTestContext, createAuthTestContext } from "../../test-support/auth-app.js";
import { fixedClock } from "../../test-support/clock.js";
import { meRequests } from "../../test-support/me-requests.js";

const NOW = "2026-11-24T10:00:00.000Z";
const TODAY = "2026-11-24";

let ctx: AuthTestContext;

beforeEach(async () => {
  ctx = await createAuthTestContext({}, undefined, { clock: fixedClock(NOW) });
});

afterEach(async () => {
  await ctx.close();
});

const profiles = () => ctx.db.db.collection("profiles");
const getMe = (cookie: string) => meRequests(ctx.app, ctx.config.APP_URL).getMe(cookie);
const patchMe = (cookie: string, body: object) =>
  meRequests(ctx.app, ctx.config.APP_URL).patchMe(cookie, body);

describe("GET /me", () => {
  it("[FR-13.2] returns the name, email and profile settings, and nothing internal", async () => {
    const { cookie } = await ctx.signIn();

    const res = await getMe(cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      data: {
        name: expect.any(String),
        email: expect.stringContaining("@"),
        timezone: "Asia/Kolkata",
        openingBalance: 0,
        openingBalanceDate: TODAY,
        currency: "INR",
        lastBackupAt: null,
        onboardedAt: null,
        version: 1,
      },
    });
    expect(res.text).not.toMatch(/userId|_id|nameLower|idempotencyKey/);
  });

  it("[FR-10.7] answers 401 without a session", async () => {
    const res = await request(ctx.app).get("/api/v1/me");
    expect(res.status).toBe(401);
  });

  it("[FR-10.3] only ever returns the signed-in user's own profile", async () => {
    const alice = await ctx.signIn();
    const bob = await ctx.signIn();
    await patchMe(alice.cookie, {
      version: 1,
      timezone: "UTC",
      openingBalance: 500000,
      openingBalanceDate: TODAY,
    });

    const asBob = await getMe(bob.cookie);
    const asAlice = await getMe(alice.cookie);

    expect(asBob.body.data).toMatchObject({ timezone: "Asia/Kolkata", openingBalance: 0 });
    expect(asBob.body.data.onboardedAt).toBeNull();
    expect(asAlice.body.data).toMatchObject({ timezone: "UTC", openingBalance: 500000 });
    expect(asAlice.body.data.email).not.toBe(asBob.body.data.email);
  });
});

describe("PATCH /me ownership and versions", () => {
  it("[FR-9.8] answers 409 STALE_RECORD for a version that is out of date", async () => {
    const { cookie } = await ctx.signIn();
    await patchMe(cookie, { version: 1, timezone: "UTC" });

    const res = await patchMe(cookie, { version: 1, timezone: "Europe/London" });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatchObject({
      code: "STALE_RECORD",
      message: ERROR_MESSAGES.STALE_RECORD,
    });
    expect((await getMe(cookie)).body.data).toMatchObject({ timezone: "UTC", version: 2 });
  });

  it("[FR-10.3] changes only the signed-in user's own profile", async () => {
    const alice = await ctx.signIn();
    const bob = await ctx.signIn();
    await getMe(bob.cookie);

    await patchMe(alice.cookie, {
      version: 1,
      timezone: "UTC",
      openingBalance: 99900,
      openingBalanceDate: TODAY,
    });

    expect(await profiles().findOne({ userId: bob.userId })).toMatchObject({
      timezone: "Asia/Kolkata",
      openingBalance: 0,
      onboardedAt: null,
      version: 1,
    });
    expect(await profiles().findOne({ userId: alice.userId })).toMatchObject({
      timezone: "UTC",
      openingBalance: 99900,
      version: 2,
    });
  });

  it("[FR-10.7] answers 401 to a PATCH without a session", async () => {
    const res = await request(ctx.app)
      .patch("/api/v1/me")
      .set("Origin", new URL(ctx.config.APP_URL).origin)
      .send({ version: 1, timezone: "UTC" });
    expect(res.status).toBe(401);
  });
});
