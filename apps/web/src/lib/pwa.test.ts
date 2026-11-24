import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, "../../dist");

describe("PWA assets", () => {
  it.skipIf(!existsSync(DIST))("[FR-3.1] built output includes a web app manifest", () => {
    const files = ["manifest.webmanifest", "manifest.json"];
    const found = files.some((f) => existsSync(resolve(DIST, f)));
    expect(found, "manifest file not found in dist").toBe(true);
  });

  it.skipIf(!existsSync(DIST))("[FR-3.1] manifest has required PWA fields", () => {
    const candidatePaths = [resolve(DIST, "manifest.webmanifest"), resolve(DIST, "manifest.json")];
    const manifestPath = candidatePaths.find((p) => existsSync(p));
    if (manifestPath === undefined) return;
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Record<string, unknown>;
    expect(manifest.name).toBe("Outgo");
    expect(manifest.short_name).toBe("Outgo");
    expect(manifest.theme_color).toBe("#FAF9FC");
    expect(manifest.background_color).toBe("#FAF9FC");
    expect(manifest.display).toBe("standalone");
    const icons = manifest.icons as Array<{ purpose?: string; sizes: string }>;
    expect(icons.some((i) => i.sizes === "192x192")).toBe(true);
    expect(icons.some((i) => i.sizes === "512x512")).toBe(true);
    expect(icons.some((i) => i.purpose === "maskable")).toBe(true);
  });

  it.skipIf(!existsSync(DIST))("[FR-3.6] built output includes a service worker file", () => {
    const swPath = resolve(DIST, "sw.js");
    expect(existsSync(swPath), "sw.js not found in dist").toBe(true);
  });

  it.skipIf(!existsSync(DIST))(
    "[FR-3.6] service worker routes /api paths to NetworkOnly handler",
    () => {
      const swPath = resolve(DIST, "sw.js");
      if (!existsSync(swPath)) return;
      const sw = readFileSync(swPath, "utf8");
      // Workbox serialises /\/api\// as the RegExp literal and pairs it with the handler name.
      expect(sw).toMatch(/api.*NetworkOnly/s);
    },
  );
});
