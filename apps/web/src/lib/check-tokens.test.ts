import { describe, expect, it } from "vitest";
import { findHexColorLines } from "../../../../tools/check-tokens.mjs";

describe("check:tokens — findHexColorLines", () => {
  it("returns an empty array for clean component code", () => {
    const code = `
export function Badge({ children }: { children: React.ReactNode }) {
  return <span className="bg-primary-soft text-primary rounded-sm px-2">{children}</span>;
}
    `.trim();
    expect(findHexColorLines(code)).toEqual([]);
  });

  it("returns the line number when a hex colour is hard-coded in JSX", () => {
    const code = `
export function Badge() {
  return <span style={{ backgroundColor: "#7C3AED" }}>hi</span>;
}
    `.trim();
    expect(findHexColorLines(code)).toEqual([2]);
  });

  it("returns the line number when a hex colour appears in a className string", () => {
    const code = `const cls = "text-[#EDE9FE] bg-background";`;
    expect(findHexColorLines(code)).toEqual([1]);
  });

  it("ignores hex colours that appear only in // comment lines", () => {
    const code = `
// was: style={{ color: "#DC2626" }}
export function Alert() {
  return <div className="text-alert" />;
}
    `.trim();
    expect(findHexColorLines(code)).toEqual([]);
  });

  it("ignores hex colours in JSDoc * comment lines", () => {
    const code = `
/**
 * Uses --primary: #7C3AED from the token sheet.
 */
export function foo() { return null; }
    `.trim();
    expect(findHexColorLines(code)).toEqual([]);
  });

  it("flags multiple violations on different lines", () => {
    const code = `
const a = "#FAF9FC";
const b = "clean";
const c = "#1C1A22";
    `.trim();
    expect(findHexColorLines(code)).toEqual([1, 3]);
  });
});
