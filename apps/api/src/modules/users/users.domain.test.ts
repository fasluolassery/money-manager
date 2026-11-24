import type { CalendarDate, Paise } from "@money-manager/shared";
import { describe, expect, it } from "vitest";
import {
  buildNewProfile,
  buildProfileChanges,
  type Profile,
  toMeResponse,
} from "./users.domain.js";

const NOW = new Date("2026-11-24T10:00:00.000Z");
const LATER = new Date("2026-12-01T10:00:00.000Z");
const TODAY = "2026-11-24" as CalendarDate;

function profile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: "p1",
    userId: "user_1",
    timezone: "Asia/Kolkata",
    openingBalance: 0 as Paise,
    openingBalanceDate: TODAY,
    currency: "INR",
    lastBackupAt: null,
    onboardedAt: null,
    version: 1,
    ...overrides,
  };
}

describe("buildNewProfile", () => {
  it("[FR-13.1] starts in Asia/Kolkata with a zero balance dated today, not onboarded", () => {
    expect(buildNewProfile("user_1", NOW, TODAY)).toEqual({
      userId: "user_1",
      timezone: "Asia/Kolkata",
      openingBalance: 0,
      openingBalanceDate: TODAY,
      currency: "INR",
      lastBackupAt: null,
      onboardedAt: null,
      createdAt: NOW,
      updatedAt: NOW,
      version: 1,
    });
  });
});

describe("buildProfileChanges", () => {
  it("[FR-13.3] Continue changes the timezone, balance and date, and marks onboarding done", () => {
    const changes = buildProfileChanges(
      profile(),
      {
        timezone: "UTC",
        openingBalance: -5000 as Paise,
        openingBalanceDate: "2026-11-01" as CalendarDate,
      },
      NOW,
    );
    expect(changes).toEqual({
      timezone: "UTC",
      openingBalance: -5000,
      openingBalanceDate: "2026-11-01",
      onboardedAt: NOW,
      updatedAt: NOW,
    });
  });

  it("[FR-13.3] Skip leaves the balance and date out of the changes", () => {
    const changes = buildProfileChanges(profile(), { timezone: "UTC" }, NOW);
    expect(changes).toEqual({ timezone: "UTC", onboardedAt: NOW, updatedAt: NOW });
    expect(changes).not.toHaveProperty("openingBalance");
    expect(changes).not.toHaveProperty("openingBalanceDate");
  });

  it("[FR-13.4] keeps the time onboarding finished at on later saves", () => {
    const changes = buildProfileChanges(profile({ onboardedAt: NOW }), { timezone: "UTC" }, LATER);
    expect(changes.onboardedAt).toBe(NOW);
    expect(changes.updatedAt).toBe(LATER);
  });
});

describe("toMeResponse", () => {
  it("[FR-13.2] shows timestamps as ISO strings and only the fields the client needs", () => {
    const me = toMeResponse(profile({ onboardedAt: NOW }), {
      name: "Save",
      email: "s@example.com",
    });
    expect(me).toEqual({
      name: "Save",
      email: "s@example.com",
      timezone: "Asia/Kolkata",
      openingBalance: 0,
      openingBalanceDate: TODAY,
      currency: "INR",
      lastBackupAt: null,
      onboardedAt: "2026-11-24T10:00:00.000Z",
      version: 1,
    });
  });
});
