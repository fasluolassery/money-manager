import { expect, it } from "vitest";

it("fails on purpose to prove red CI blocks merging", () => {
  expect(1 + 1).toBe(3);
});
