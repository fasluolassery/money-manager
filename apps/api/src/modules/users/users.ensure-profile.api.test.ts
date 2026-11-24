import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { type AuthTestContext, createAuthTestContext } from "../../test-support/auth-app.js";
import { fixedClock } from "../../test-support/clock.js";
import { meRequests } from "../../test-support/me-requests.js";
import { DEFAULT_CATEGORIES } from "../categories/categories.domain.js";

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
const categories = () => ctx.db.db.collection("categories");
const categoriesOf = (userId: string) => categories().find({ userId }).toArray();
const getMe = (cookie: string) => meRequests(ctx.app, ctx.config.APP_URL).getMe(cookie);

describe("first sign-in setup", () => {
  it("[FR-13.1] creates the profile with its defaults when Better Auth creates a user", async () => {
    const { userId } = await ctx.createUser();

    const stored = await profiles().find({ userId }).toArray();

    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({
      timezone: "Asia/Kolkata",
      openingBalance: 0,
      openingBalanceDate: TODAY,
      currency: "INR",
      onboardedAt: null,
      lastBackupAt: null,
      version: 1,
    });
  });

  it("[FR-13.1] [FR-5.4] creates the 11 default categories with their emojis", async () => {
    const { userId } = await ctx.createUser();

    const created = await categoriesOf(userId);

    expect(created).toHaveLength(11);
    const shape = created.map(({ name, emoji, type, builtIn }) => ({ name, emoji, type, builtIn }));
    expect(shape).toEqual(expect.arrayContaining([...DEFAULT_CATEGORIES]));
    expect(created.filter((c) => c.type === "expense")).toHaveLength(8);
    expect(created.filter((c) => c.type === "income")).toHaveLength(2);
    expect(created.filter((c) => c.builtIn)).toMatchObject([{ name: "Lending", emoji: "🤝" }]);
  });

  it("[FR-13.1] creates the profile on the first request when the hook never ran", async () => {
    const { userId, cookie } = await ctx.signIn();
    await profiles().deleteMany({ userId });
    await categories().deleteMany({ userId });

    const res = await getMe(cookie);

    expect(res.status).toBe(200);
    expect(await profiles().countDocuments({ userId })).toBe(1);
    expect(await categoriesOf(userId)).toHaveLength(11);
  });
});

describe("ensureProfile repeats", () => {
  it("[FR-13.1] does nothing the second time, and never touches categories I changed", async () => {
    const { userId } = await ctx.createUser();
    const { usersService } = ctx.container.cradle;
    const before = await profiles().findOne({ userId });
    await categories().updateOne({ userId, nameLower: "food" }, { $set: { emoji: "🥗" } });

    await usersService.ensureProfile(userId);
    await usersService.ensureProfile(userId);

    expect(await profiles().find({ userId }).toArray()).toEqual([before]);
    expect(await categoriesOf(userId)).toHaveLength(11);
    expect(await categories().findOne({ userId, nameLower: "food" })).toMatchObject({
      emoji: "🥗",
    });
  });

  it("[FR-13.1] recreates a profile deleted by hand, without duplicating categories", async () => {
    const { userId, cookie } = await ctx.signIn();
    await getMe(cookie);
    await profiles().deleteMany({ userId });

    const res = await getMe(cookie);

    expect(res.status).toBe(200);
    expect(await profiles().countDocuments({ userId })).toBe(1);
    expect(await categoriesOf(userId)).toHaveLength(11);
  });

  it("[FR-13.1] makes exactly one profile when calls arrive at the same time", async () => {
    const { userId } = await ctx.signIn();
    const { usersService } = ctx.container.cradle;

    await Promise.all(Array.from({ length: 6 }, () => usersService.ensureProfile(userId)));

    expect(await profiles().countDocuments({ userId })).toBe(1);
    expect(await categoriesOf(userId)).toHaveLength(11);
  });
});
