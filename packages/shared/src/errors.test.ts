import { describe, expect, it } from "vitest";
import { ERROR_CODES, ERROR_MESSAGES, isErrorCode } from "./errors.js";

describe("error catalogue", () => {
  it("has a default message for every closed error code (D-39)", () => {
    for (const code of ERROR_CODES) {
      expect(ERROR_MESSAGES[code].length).toBeGreaterThan(0);
      expect(ERROR_MESSAGES[code]).not.toMatch(/error \d|invalid input|exception/i);
    }
  });

  it("accepts only catalogue codes in isErrorCode", () => {
    expect(isErrorCode("VALIDATION_ERROR")).toBe(true);
    expect(isErrorCode("NOT_A_CODE")).toBe(false);
  });
});
