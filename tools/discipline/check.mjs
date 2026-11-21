#!/usr/bin/env node
/**
 * Discipline checks not covered by Biome (DESIGN 10.4, D-50):
 *
 *  1. No clock in domain files: Date.now() or new Date() (no args) in *.domain.ts
 *  2. No raw money arithmetic outside packages/shared/src/money.ts:
 *     * 100, / 100, .toFixed(, parseFloat(
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = fileURLToPath(new URL("../..", import.meta.url));

// ── Patterns ────────────────────────────────────────────────────────────────

/** Matches Date.now() or new Date() with no arguments. */
const CLOCK_PATTERNS = [/\bDate\.now\s*\(\)/, /\bnew\s+Date\s*\(\s*\)/];

/** Matches raw money-unit conversions and formatting calls. */
const MONEY_PATTERNS = [
  /[^/*]\*\s*100\b/, // × 100  (guard: not *100 as regex or comment)
  /\b100\s*\*/, // 100 × something
  /\/\s*100\b/, // ÷ 100
  /\.toFixed\s*\(/, // toFixed(n) on a number
  /\bparseFloat\s*\(/, // parseFloat(str)
];

// ── File walker ──────────────────────────────────────────────────────────────

function walk(dir, filter) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === "node_modules" || entry === "dist") continue;
      results.push(...walk(full, filter));
    } else if (filter(entry, full)) {
      results.push(full);
    }
  }
  return results;
}

// ── Shared line scanner ──────────────────────────────────────────────────────

function scanFile(file, patterns, label) {
  const violations = [];
  const lines = readFileSync(file, "utf8").split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    if (line.trimStart().startsWith("//")) continue;
    if (patterns.some((p) => p.test(line))) {
      violations.push(`${relative(REPO_ROOT, file)}:${i + 1} — ${label}: ${line.trim()}`);
    }
  }
  return violations;
}

// ── Check 1: No clock in domain files ───────────────────────────────────────

function checkDomainClock() {
  const files = walk(
    join(REPO_ROOT, "apps/api/src"),
    (name) => name.endsWith(".domain.ts") && !name.endsWith(".test.ts"),
  );
  return files.flatMap((f) => scanFile(f, CLOCK_PATTERNS, "clock in domain"));
}

// ── Check 2: No raw money arithmetic outside money.ts ────────────────────────

function checkMoneyArithmetic() {
  const MONEY_FILE = join(REPO_ROOT, "packages/shared/src/money.ts");

  const tsFiles = [
    ...walk(join(REPO_ROOT, "apps/api/src"), (name) => name.endsWith(".ts")),
    ...walk(
      join(REPO_ROOT, "apps/web/src"),
      (name) => name.endsWith(".ts") || name.endsWith(".tsx"),
    ),
    ...walk(
      join(REPO_ROOT, "packages/shared/src"),
      (name) => name.endsWith(".ts") && name !== "money.ts",
    ),
  ].filter((f) => f !== MONEY_FILE && !f.endsWith(".test.ts") && !f.endsWith(".test.tsx"));

  return tsFiles.flatMap((f) => scanFile(f, MONEY_PATTERNS, "raw money arithmetic"));
}

// ── Main ─────────────────────────────────────────────────────────────────────

const clockViolations = checkDomainClock();
const moneyViolations = checkMoneyArithmetic();
const all = [...clockViolations, ...moneyViolations];

if (all.length > 0) {
  console.error("check:discipline — violations found:\n");
  for (const v of all) console.error(`  ✗ ${v}`);
  console.error(`\n${all.length} violation(s). See DESIGN 10.4 (D-50).`);
  process.exit(1);
}

console.log("check:discipline — OK");
