import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { type AuthTestContext, createAuthTestContext } from "../../test-support/auth-app.js";
import { buildCategoryDocument, buildUserId } from "../../test-support/builders.js";

const DOCUMENT_VALIDATION_FAILURE = 121;
const DUPLICATE_KEY = 11000;

let ctx: AuthTestContext;

beforeEach(async () => {
  ctx = await createAuthTestContext();
});

afterEach(async () => {
  await ctx.close();
});

const categories = () => ctx.db.db.collection("categories");

describe("categories validator and indexes", () => {
  it("[FR-5.2] accepts a well-formed category of each type", async () => {
    for (const [name, type] of [
      ["A", "expense"],
      ["B", "income"],
      ["C", "both"],
    ] as const) {
      await expect(
        categories().insertOne(buildCategoryDocument({ name, type })),
      ).resolves.toMatchObject({ acknowledged: true });
    }
  });

  it("[FR-5.2] [FR-9.8] refuses a category inserted directly with bad data", async () => {
    const invalid: Record<string, unknown>[] = [
      { type: "transfer" },
      { emoji: "" },
      { emoji: undefined },
      { name: "" },
      { name: "x".repeat(41) },
      { builtIn: "yes" },
      { userId: undefined },
      { version: 0 },
      { version: "1" },
    ];

    for (const change of invalid) {
      const document = { ...buildCategoryDocument(), ...change };
      await expect(categories().insertOne(document), JSON.stringify(change)).rejects.toMatchObject({
        code: DOCUMENT_VALIDATION_FAILURE,
      });
    }
    expect(await categories().countDocuments()).toBe(0);
  });

  it("[FR-5.6] refuses a second category with the same name for a user, ignoring case", async () => {
    const userId = buildUserId();
    await categories().insertOne(buildCategoryDocument({ userId, name: "Food" }));

    await expect(
      categories().insertOne(buildCategoryDocument({ userId, name: "FOOD" })),
    ).rejects.toMatchObject({ code: DUPLICATE_KEY });
  });

  it("[FR-5.6] lets two users have a category with the same name", async () => {
    await categories().insertOne(buildCategoryDocument({ name: "Food" }));

    await expect(
      categories().insertOne(buildCategoryDocument({ name: "Food" })),
    ).resolves.toMatchObject({ acknowledged: true });
  });
});
