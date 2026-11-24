import { MAX_AMOUNT_PAISE } from "@money-manager/shared";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { type AuthTestContext, createAuthTestContext } from "../../test-support/auth-app.js";
import { buildProfileDocument, buildUserId } from "../../test-support/builders.js";

const DOCUMENT_VALIDATION_FAILURE = 121;
const DUPLICATE_KEY = 11000;

let ctx: AuthTestContext;

beforeEach(async () => {
  ctx = await createAuthTestContext();
});

afterEach(async () => {
  await ctx.close();
});

const profiles = () => ctx.db.db.collection("profiles");

describe("profiles validator and indexes", () => {
  it("[FR-9.8] accepts a well-formed profile, including a negative opening balance", async () => {
    await expect(
      profiles().insertOne(buildProfileDocument({ openingBalance: -250000 })),
    ).resolves.toMatchObject({
      acknowledged: true,
    });
  });

  it("[FR-9.2] [FR-9.8] refuses a profile inserted directly with bad data", async () => {
    const invalid: Record<string, unknown>[] = [
      { openingBalance: 12.5 },
      { openingBalance: "100" },
      { openingBalance: MAX_AMOUNT_PAISE + 1 },
      { openingBalance: -MAX_AMOUNT_PAISE - 1 },
      { openingBalanceDate: "24/11/2026" },
      { currency: "USD" },
      { userId: undefined },
      { timezone: "" },
      { version: 0 },
      { version: 1.5 },
      { onboardedAt: "yesterday" },
    ];

    for (const change of invalid) {
      const document = { ...buildProfileDocument(), ...change };
      await expect(profiles().insertOne(document), JSON.stringify(change)).rejects.toMatchObject({
        code: DOCUMENT_VALIDATION_FAILURE,
      });
    }
    expect(await profiles().countDocuments()).toBe(0);
  });

  it("[FR-13.1] refuses a second profile for the same user", async () => {
    const userId = buildUserId();
    await profiles().insertOne(buildProfileDocument({ userId }));

    await expect(profiles().insertOne(buildProfileDocument({ userId }))).rejects.toMatchObject({
      code: DUPLICATE_KEY,
    });
  });
});
