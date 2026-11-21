/**
 * Fails if any component file under apps/web/src contains a hard-coded hex
 * colour.  Components must use Tailwind token classes (UI.md 4.1, DESIGN 10.2).
 *
 * Excluded: test files, the dev-only page tree, and styles.css itself (where
 * the token values are legitimately defined as hex literals).
 */
import { fileURLToPath } from "node:url";

/** Matches #RGB, #RRGGBB and #RRGGBBAA literals (not comment-only lines). */
const HEX_COLOR = /#[0-9a-fA-F]{3,8}\b/;

const EXCLUDED = [/\.test\.(ts|tsx)$/, /[/\\]dev[/\\]/, /styles\.css$/];

/**
 * Returns the 1-based line numbers that contain a hex colour literal.
 * Skips lines that are entirely a comment (`//` or ` *`).
 */
export function findHexColorLines(content) {
  const hits = [];
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trimStart();
    if (trimmed.startsWith("//") || trimmed.startsWith("*")) continue;
    if (HEX_COLOR.test(lines[i])) hits.push(i + 1);
  }
  return hits;
}

// ─── CLI entry point ────────────────────────────────────────────────────────
const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  const { readFileSync, readdirSync, statSync } = await import("node:fs");
  const { dirname, extname, join } = await import("node:path");

  function* walk(dir) {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        yield* walk(full);
      } else {
        yield full;
      }
    }
  }

  // Resolve relative to this file so the script works from any CWD.
  const REPO_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
  const SCAN_ROOT = join(REPO_ROOT, "apps/web/src");
  let violations = 0;

  for (const file of walk(SCAN_ROOT)) {
    const ext = extname(file);
    if (ext !== ".ts" && ext !== ".tsx" && ext !== ".css") continue;
    if (EXCLUDED.some((re) => re.test(file))) continue;

    const hits = findHexColorLines(readFileSync(file, "utf8"));
    for (const line of hits) {
      process.stderr.write(`${file}:${line}: hard-coded hex colour\n`);
      violations++;
    }
  }

  if (violations > 0) {
    process.stderr.write(
      `\n${violations} violation(s). Use design token classes instead (UI.md 4.1).\n`,
    );
    process.exit(1);
  }
  process.stdout.write("OK: no hard-coded hex colours in component files\n");
}
