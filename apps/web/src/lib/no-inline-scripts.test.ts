import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));
const INDEX_HTML = resolve(__dirname, "../../index.html");

describe("index.html", () => {
  it("[FR-3.5] contains no inline <script> elements (DESIGN 7.6)", () => {
    const html = readFileSync(INDEX_HTML, "utf8");
    // A <script> tag with no src attribute and non-whitespace content is an inline script.
    expect(html).not.toMatch(/<script(?![^>]*\bsrc\s*=)[^>]*>\s*\S/i);
  });
});
