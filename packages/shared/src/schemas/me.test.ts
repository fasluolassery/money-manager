import { describe, expect, it } from "vitest";
import { MAX_AMOUNT_PAISE } from "../money.js";
import { VALIDATION_MESSAGES as M } from "./common.js";
import { meResponseSchema, patchMeBodySchema } from "./me.js";

const SKIP = { version: 1, timezone: "Asia/Kolkata" };
const CONTINUE = { ...SKIP, openingBalance: 150000, openingBalanceDate: "2026-11-24" };

function messages(body: unknown): string[] {
  const result = patchMeBodySchema.safeParse(body);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe("patchMeBodySchema", () => {
  it("[FR-13.3] accepts Skip (timezone only) and Continue (timezone, balance and date)", () => {
    expect(patchMeBodySchema.safeParse(SKIP).success).toBe(true);
    expect(patchMeBodySchema.safeParse(CONTINUE).success).toBe(true);
  });

  it("[FR-9.2] accepts a negative opening balance and zero", () => {
    expect(patchMeBodySchema.safeParse({ ...CONTINUE, openingBalance: -250000 }).success).toBe(
      true,
    );
    expect(patchMeBodySchema.safeParse({ ...CONTINUE, openingBalance: 0 }).success).toBe(true);
  });

  it("[FR-9.2] rejects a fractional amount and one beyond ±₹1,00,00,000", () => {
    expect(messages({ ...CONTINUE, openingBalance: 12.5 })).toEqual([M.amountNotWhole]);
    expect(messages({ ...CONTINUE, openingBalance: MAX_AMOUNT_PAISE + 1 })).toEqual([
      M.openingBalanceTooHigh,
    ]);
    expect(messages({ ...CONTINUE, openingBalance: -MAX_AMOUNT_PAISE - 1 })).toEqual([
      M.openingBalanceTooLow,
    ]);
  });

  it("[FR-13.2] rejects an unknown timezone and a missing one", () => {
    expect(messages({ ...SKIP, timezone: "Mars/Olympus" })).toEqual([M.timezone]);
    expect(messages({ version: 1 })).toEqual([M.timezone]);
  });

  it("[FR-13.3] needs the balance and its date together", () => {
    expect(messages({ ...SKIP, openingBalance: 100 })).toEqual([M.date]);
    expect(messages({ ...SKIP, openingBalanceDate: "2026-11-24" })).toEqual([M.amountMissing]);
  });

  it("[FR-9.8] needs the record version and refuses unknown fields", () => {
    expect(messages({ timezone: "Asia/Kolkata" })).toEqual([M.invalid]);
    expect(messages({ ...SKIP, onboardedAt: "2026-11-24T00:00:00.000Z" })).toEqual([M.invalid]);
  });
});

describe("meResponseSchema", () => {
  const me = {
    name: "Save Fas",
    email: "save@example.com",
    timezone: "Asia/Kolkata",
    openingBalance: 0,
    openingBalanceDate: "2026-11-24",
    currency: "INR",
    lastBackupAt: null,
    onboardedAt: null,
    version: 1,
  };

  it("[FR-9.8] describes the profile with a version and ISO timestamps", () => {
    expect(meResponseSchema.parse(me)).toEqual(me);
    const onboarded = { ...me, onboardedAt: "2026-11-24T10:00:00.000Z" };
    expect(meResponseSchema.parse(onboarded)).toEqual(onboarded);
  });

  it("[FR-9.8] has no field for the owner id", () => {
    expect(Object.keys(meResponseSchema.shape)).not.toContain("userId");
  });
});
