import { describe, expect, it } from "vitest";
import { assertNever } from "./assert-never.js";

describe("assertNever", () => {
  it("fails fast when a value the types ruled out turns up at run time", () => {
    const impossible = "lent" as never;
    expect(() => assertNever(impossible)).toThrow('Unexpected value: "lent"');
  });
});
