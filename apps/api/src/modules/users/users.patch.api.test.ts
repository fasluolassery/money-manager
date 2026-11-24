import { VALIDATION_MESSAGES as M, MAX_AMOUNT_PAISE } from "@money-manager/shared";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Clock } from "../../clock.js";
import { type AuthTestContext, createAuthTestContext } from "../../test-support/auth-app.js";
import { meRequests } from "../../test-support/me-requests.js";

const NOW = "2026-11-24T10:00:00.000Z";
const TODAY = "2026-11-24";

let ctx: AuthTestContext;
let current: Date;
const clock: Clock = { now: () => new Date(current) };

beforeEach(async () => {
  current = new Date(NOW);
  ctx = await createAuthTestContext({}, undefined, { clock });
});

afterEach(async () => {
  await ctx.close();
});

const getMe = (cookie: string) => meRequests(ctx.app, ctx.config.APP_URL).getMe(cookie);
const patchMe = (cookie: string, body: object) =>
  meRequests(ctx.app, ctx.config.APP_URL).patchMe(cookie, body);

describe("PATCH /me", () => {
  it("[FR-13.3] [FR-13.4] Continue saves the timezone, balance and date and finishes onboarding", async () => {
    const { cookie } = await ctx.signIn();

    const res = await patchMe(cookie, {
      version: 1,
      timezone: "Asia/Dubai",
      openingBalance: 1234550,
      openingBalanceDate: "2026-11-01",
    });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      timezone: "Asia/Dubai",
      openingBalance: 1234550,
      openingBalanceDate: "2026-11-01",
      onboardedAt: NOW,
      version: 2,
    });
  });

  it("[FR-13.3] Skip saves only the timezone, keeps the balance, and still finishes onboarding", async () => {
    const { cookie } = await ctx.signIn();

    const res = await patchMe(cookie, { version: 1, timezone: "Europe/London" });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      timezone: "Europe/London",
      openingBalance: 0,
      openingBalanceDate: TODAY,
      onboardedAt: NOW,
      version: 2,
    });
  });

  it("[FR-9.2] accepts a negative opening balance and one exactly at ±₹1,00,00,000", async () => {
    const { cookie } = await ctx.signIn();
    let version = 1;
    for (const openingBalance of [-250000, MAX_AMOUNT_PAISE, -MAX_AMOUNT_PAISE]) {
      const body = { version, timezone: "UTC", openingBalance, openingBalanceDate: TODAY };
      const res = await patchMe(cookie, body);
      expect(res.status, String(openingBalance)).toBe(200);
      expect(res.body.data.openingBalance).toBe(openingBalance);
      version = res.body.data.version;
    }
  });

  it("[FR-13.4] keeps the first onboarding time on later saves", async () => {
    const { cookie } = await ctx.signIn();
    await patchMe(cookie, { version: 1, timezone: "UTC" });
    current = new Date("2026-11-25T08:00:00.000Z");

    const res = await patchMe(cookie, { version: 2, timezone: "UTC" });

    expect(res.body.data).toMatchObject({ onboardedAt: NOW, version: 3 });
  });
});

const VALID = {
  version: 1,
  timezone: "Asia/Kolkata",
  openingBalance: 100,
  openingBalanceDate: TODAY,
};

// [field, what to change, message]; the clock is 2026-11-24 10:00 UTC, so "2026-11-26" is future.
const REJECTED: [string, Record<string, unknown>, string][] = [
  ["timezone", { timezone: "Mars/Olympus" }, M.timezone],
  ["openingBalance", { openingBalance: 12.5 }, M.amountNotWhole],
  ["openingBalance", { openingBalance: MAX_AMOUNT_PAISE + 1 }, M.openingBalanceTooHigh],
  ["openingBalance", { openingBalance: -MAX_AMOUNT_PAISE - 1 }, M.openingBalanceTooLow],
  ["openingBalanceDate", { openingBalanceDate: "2026-11-26" }, M.dateInFuture],
  ["openingBalanceDate", { openingBalanceDate: "2026-02-30" }, M.date],
];

describe("PATCH /me validation", () => {
  it("[FR-13.2] [FR-9.2] [FR-9.3] answers 400 for a bad timezone, amount or date, and saves nothing", async () => {
    const { cookie } = await ctx.signIn();

    for (const [field, change, message] of REJECTED) {
      const res = await patchMe(cookie, { ...VALID, ...change });
      expect(res.status, message).toBe(400);
      expect(res.body.error).toMatchObject({
        code: "VALIDATION_ERROR",
        details: [{ field, message }],
      });
    }

    const { data } = (await getMe(cookie)).body;
    expect(data).toMatchObject({ version: 1, openingBalance: 0 });
    expect(data.onboardedAt).toBeNull();
  });

  it("[FR-9.3] judges the date by today in the chosen timezone", async () => {
    current = new Date("2026-11-24T20:00:00.000Z");
    const { cookie } = await ctx.signIn();
    const tomorrowInKolkata = "2026-11-25";

    const kolkata = await patchMe(cookie, { ...VALID, openingBalanceDate: tomorrowInKolkata });
    const utc = await patchMe(cookie, {
      ...VALID,
      version: 2,
      timezone: "UTC",
      openingBalanceDate: tomorrowInKolkata,
    });

    expect(kolkata.status).toBe(200);
    expect(utc.status).toBe(400);
  });

  it("[FR-13.3] [FR-9.8] answers 400 for a balance without a date, no version, and unknown fields", async () => {
    const { cookie } = await ctx.signIn();
    const { openingBalanceDate: _date, ...balanceOnly } = VALID;
    const { version: _version, ...noVersion } = VALID;
    const bodies = [
      balanceOnly,
      noVersion,
      { ...VALID, userId: "someone-else" },
      { ...VALID, onboardedAt: null },
    ];

    for (const body of bodies) {
      expect((await patchMe(cookie, body)).status, JSON.stringify(body)).toBe(400);
    }
  });
});
