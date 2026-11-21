import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const SRC_ROOT = fileURLToPath(new URL(".", import.meta.url));

/** Runtime imports of the driver — `import type` is allowed anywhere. */
const MONGODB_IMPORT = /(?:^|\n)import\s+(?!type\b)[^;]*from\s+["']mongodb["']/;

function listTsFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      files.push(...listTsFiles(full));
      continue;
    }
    if (entry.endsWith(".ts") && !entry.endsWith(".test.ts") && !entry.endsWith(".api.test.ts")) {
      files.push(full);
    }
  }
  return files;
}

function mayImportMongodb(relativePath: string): boolean {
  if (relativePath.startsWith(`db${join("/", "")}`) || relativePath.startsWith("db/")) {
    return true;
  }
  if (relativePath.includes(".repository.")) {
    return true;
  }
  // Test helpers may wire real or fake db handles.
  if (relativePath.startsWith("test-support/")) {
    return true;
  }
  return false;
}

describe("MongoDB import boundaries", () => {
  it("only repository files and db/ import the MongoDB driver", () => {
    const offenders: string[] = [];

    for (const file of listTsFiles(SRC_ROOT)) {
      const rel = relative(SRC_ROOT, file).replaceAll("\\", "/");
      const source = readFileSync(file, "utf8");
      if (!MONGODB_IMPORT.test(source)) continue;
      if (!mayImportMongodb(rel)) {
        offenders.push(rel);
      }
    }

    expect(offenders).toEqual([]);
  });
});
