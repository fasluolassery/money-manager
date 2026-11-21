import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// REPO_ROOT is two levels up from apps/api/src
const REPO_ROOT = fileURLToPath(new URL("../../..", import.meta.url));
const API_SRC = join(REPO_ROOT, "apps/api/src");
const WEB_SRC = join(REPO_ROOT, "apps/web/src");
const SHARED_SRC = join(REPO_ROOT, "packages/shared/src");
const MONEY_TS = join(SHARED_SRC, "money.ts");

function listFiles(dir: string, ext: (n: string) => boolean): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === "node_modules" || entry === "dist") continue;
      results.push(...listFiles(full, ext));
    } else if (ext(entry)) {
      results.push(full);
    }
  }
  return results;
}

/** Returns lines in `file` that match any of `patterns`, excluding line comments. */
function matchingLines(file: string, patterns: RegExp[]): number[] {
  return readFileSync(file, "utf8")
    .split("\n")
    .flatMap((line, i) => {
      if (line.trimStart().startsWith("//")) return [];
      return patterns.some((p) => p.test(line)) ? [i + 1] : [];
    });
}

describe("Discipline rules (DESIGN 10.4, D-50)", () => {
  it("[D-50] no clock calls in domain files — Date.now() and no-arg new Date() are banned", () => {
    const CLOCK_PATTERNS = [/\bDate\.now\s*\(\)/, /\bnew\s+Date\s*\(\s*\)/];
    const offenders: string[] = [];

    for (const file of listFiles(
      API_SRC,
      (n) => n.endsWith(".domain.ts") && !n.endsWith(".test.ts"),
    )) {
      for (const lineNo of matchingLines(file, CLOCK_PATTERNS)) {
        offenders.push(`${relative(REPO_ROOT, file)}:${lineNo}`);
      }
    }

    expect(offenders).toEqual([]);
  });

  it("[D-50] no raw money arithmetic outside packages/shared/src/money.ts", () => {
    const MONEY_PATTERNS = [
      /[^/*]\*\s*100\b/,
      /\b100\s*\*/,
      /\/\s*100\b/,
      /\.toFixed\s*\(/,
      /\bparseFloat\s*\(/,
    ];

    const tsFiles = [
      ...listFiles(API_SRC, (n) => n.endsWith(".ts")),
      ...listFiles(WEB_SRC, (n) => n.endsWith(".ts") || n.endsWith(".tsx")),
      ...listFiles(SHARED_SRC, (n) => n.endsWith(".ts")),
    ].filter((f) => f !== MONEY_TS && !f.endsWith(".test.ts") && !f.endsWith(".test.tsx"));

    const offenders: string[] = [];
    for (const file of tsFiles) {
      for (const lineNo of matchingLines(file, MONEY_PATTERNS)) {
        offenders.push(`${relative(REPO_ROOT, file)}:${lineNo}`);
      }
    }

    expect(offenders).toEqual([]);
  });
});
