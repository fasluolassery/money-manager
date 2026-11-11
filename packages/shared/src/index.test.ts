import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { APP_NAME } from "./index.js";

describe("APP_NAME", () => {
  it("is the working name from SPEC Rule 1", () => {
    expect(APP_NAME).toBe("Money Manager");
  });
});

describe("NFC normalization", () => {
  it("is idempotent, so names normalized on save compare equal on read", () => {
    fc.assert(
      fc.property(fc.string({ unit: "grapheme" }), (text) => {
        const once = text.normalize("NFC");
        expect(once.normalize("NFC")).toBe(once);
      }),
    );
  });
});
