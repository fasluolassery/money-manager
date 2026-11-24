import { describe, expect, it } from "vitest";
import { safeReturnTo } from "./auth-return-to.js";

describe("safeReturnTo", () => {
  it("[FR-2.3] keeps an in-app path for the post-sign-in redirect", () => {
    expect(safeReturnTo("/reports?month=2026-11")).toBe("/reports?month=2026-11");
  });

  it("[FR-2.3] rejects off-site or protocol-relative from values", () => {
    expect(safeReturnTo("https://evil.example/")).toBe("/");
    expect(safeReturnTo("//evil.example/")).toBe("/");
    expect(safeReturnTo(null)).toBe("/");
  });
});
