import { describe, expect, it } from "vitest";
import { isExactlyOneEmoji } from "./index.js";

describe("isExactlyOneEmoji (FR-5.3, Spec Rule 5)", () => {
  it("[FR-5.3] accepts a single emoji", () => {
    expect(isExactlyOneEmoji("🍕")).toBe(true);
    expect(isExactlyOneEmoji("🎯")).toBe(true);
    expect(isExactlyOneEmoji("✈️")).toBe(true);
  });

  it("[FR-5.3] accepts a ZWJ sequence as one emoji", () => {
    expect(isExactlyOneEmoji("👨‍👩‍👧")).toBe(true);
  });

  it("[FR-5.3] rejects an empty string", () => {
    expect(isExactlyOneEmoji("")).toBe(false);
  });

  it("[FR-5.3] rejects plain text", () => {
    expect(isExactlyOneEmoji("cat")).toBe(false);
    expect(isExactlyOneEmoji("a")).toBe(false);
  });

  it("[FR-5.3] rejects two emoji", () => {
    expect(isExactlyOneEmoji("🍕🍕")).toBe(false);
    expect(isExactlyOneEmoji("🍕🎯")).toBe(false);
  });

  it("[FR-5.3] rejects an emoji followed by text", () => {
    expect(isExactlyOneEmoji("🍕food")).toBe(false);
  });

  it("[FR-5.3] rejects whitespace", () => {
    expect(isExactlyOneEmoji(" ")).toBe(false);
    expect(isExactlyOneEmoji("🍕 ")).toBe(false);
  });
});
