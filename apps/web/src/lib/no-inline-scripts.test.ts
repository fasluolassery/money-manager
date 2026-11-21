import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));
// Check the built output — Vite must not inject inline scripts (DESIGN 7.6).
const DIST_INDEX = resolve(__dirname, "../../../dist/index.html");

// Inline script: a <script> with content but no src (type="module" with src is fine).
const INLINE_SCRIPT = /<script(?![^>]*\bsrc\s*=)[^>]*>\s*\S/i;

describe("built index.html", () => {
  it.skipIf(!existsSync(DIST_INDEX))(
    "[FR-3.5] contains no inline <script> elements (DESIGN 7.6)",
    () => {
      const html = readFileSync(DIST_INDEX, "utf8");
      expect(html).not.toMatch(INLINE_SCRIPT);
    },
  );
});
