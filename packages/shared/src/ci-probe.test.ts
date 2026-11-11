import { expect, it } from "vitest";

it("fails on purpose to prove CI catches it", () => {
  expect(1 + 1).toBe(3);
});
