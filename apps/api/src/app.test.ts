import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import pino from "pino";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createApp, gracefulShutdown } from "./app.js";
import type { Config } from "./config.js";

const TEST_CONFIG: Config = {
  NODE_ENV: "development",
  PORT: 3000,
  APP_URL: "http://localhost:3000",
  LOG_LEVEL: "silent",
};

const SILENT_LOGGER = pino({ level: "silent" });

let webDistPath: string;

beforeAll(() => {
  webDistPath = mkdtempSync(join(tmpdir(), "api-test-dist-"));
  mkdirSync(join(webDistPath, "assets"), { recursive: true });
  writeFileSync(join(webDistPath, "index.html"), "<!DOCTYPE html><html></html>");
  writeFileSync(join(webDistPath, "assets", "app-abc123.js"), "// js");
  writeFileSync(join(webDistPath, "manifest.webmanifest"), "{}");
});

afterAll(() => {
  rmSync(webDistPath, { recursive: true, force: true });
});

describe("GET /api/health", () => {
  it("[FR-11.2] returns 200 with status ok", async () => {
    const app = createApp(TEST_CONFIG, SILENT_LOGGER, webDistPath);
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});

describe("Security headers", () => {
  it("[FR-10.6] sets Content-Security-Policy with no inline scripts", async () => {
    const app = createApp(TEST_CONFIG, SILENT_LOGGER, webDistPath);
    const res = await request(app).get("/api/health");
    const csp = res.headers["content-security-policy"] as string;
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("style-src 'self' 'unsafe-inline'");
    expect(csp).toContain("img-src 'self' data:");
    expect(csp).toContain("font-src 'self'");
    expect(csp).toContain("connect-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
    expect(csp).toContain("object-src 'none'");
  });

  it("[FR-10.6] sets X-Content-Type-Options nosniff", async () => {
    const app = createApp(TEST_CONFIG, SILENT_LOGGER, webDistPath);
    const res = await request(app).get("/api/health");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
  });

  it("[FR-10.6] sets Referrer-Policy", async () => {
    const app = createApp(TEST_CONFIG, SILENT_LOGGER, webDistPath);
    const res = await request(app).get("/api/health");
    expect(res.headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  });

  it("[FR-10.6] sets Permissions-Policy disabling camera, microphone, geolocation, payment", async () => {
    const app = createApp(TEST_CONFIG, SILENT_LOGGER, webDistPath);
    const res = await request(app).get("/api/health");
    const pp = res.headers["permissions-policy"] as string;
    expect(pp).toContain("camera=()");
    expect(pp).toContain("microphone=()");
    expect(pp).toContain("geolocation=()");
    expect(pp).toContain("payment=()");
  });

  it("[FR-10.6] removes X-Powered-By", async () => {
    const app = createApp(TEST_CONFIG, SILENT_LOGGER, webDistPath);
    const res = await request(app).get("/api/health");
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });

  it("[FR-10.6] does not set HSTS in development", async () => {
    const app = createApp(TEST_CONFIG, SILENT_LOGGER, webDistPath);
    const res = await request(app).get("/api/health");
    expect(res.headers["strict-transport-security"]).toBeUndefined();
  });

  it("[FR-10.6] sets HSTS only when NODE_ENV is production", async () => {
    const prodApp = createApp(
      { ...TEST_CONFIG, NODE_ENV: "production" },
      SILENT_LOGGER,
      webDistPath,
    );
    const res = await request(prodApp).get("/api/health");
    const hsts = res.headers["strict-transport-security"] as string;
    expect(hsts).toContain("max-age=31536000");
    expect(hsts).toContain("includeSubDomains");
  });
});

describe("X-Request-Id", () => {
  it("[FR-10.6] includes X-Request-Id on every response", async () => {
    const app = createApp(TEST_CONFIG, SILENT_LOGGER, webDistPath);
    const res = await request(app).get("/api/health");
    expect(res.headers["x-request-id"]).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });
});

describe("Cache-Control", () => {
  it("[FR-10.6] sets no-store on API responses", async () => {
    const app = createApp(TEST_CONFIG, SILENT_LOGGER, webDistPath);
    const res = await request(app).get("/api/health");
    expect(res.headers["cache-control"]).toBe("no-store");
  });

  it("[FR-10.6] sets no-cache on index.html", async () => {
    const app = createApp(TEST_CONFIG, SILENT_LOGGER, webDistPath);
    const res = await request(app).get("/");
    expect(res.headers["cache-control"]).toBe("no-cache");
    expect(res.status).toBe(200);
  });

  it("[FR-10.6] sets immutable on hashed assets", async () => {
    const app = createApp(TEST_CONFIG, SILENT_LOGGER, webDistPath);
    const res = await request(app).get("/assets/app-abc123.js");
    expect(res.headers["cache-control"]).toBe("public, max-age=31536000, immutable");
    expect(res.status).toBe(200);
  });

  it("[FR-10.6] sets max-age=86400 on icons and manifest", async () => {
    const app = createApp(TEST_CONFIG, SILENT_LOGGER, webDistPath);
    const res = await request(app).get("/manifest.webmanifest");
    expect(res.headers["cache-control"]).toBe("public, max-age=86400");
    expect(res.status).toBe(200);
  });
});

describe("SPA fallback", () => {
  it("[FR-11.2] returns index.html for non-api routes", async () => {
    const app = createApp(TEST_CONFIG, SILENT_LOGGER, webDistPath);
    const res = await request(app).get("/some/client/route");
    expect(res.status).toBe(200);
    expect(res.text).toContain("<!DOCTYPE html>");
    expect(res.headers["cache-control"]).toBe("no-cache");
  });

  it("[FR-11.2] does not serve index.html for unknown /api routes", async () => {
    const app = createApp(TEST_CONFIG, SILENT_LOGGER, webDistPath);
    const res = await request(app).get("/api/nonexistent");
    expect(res.status).not.toBe(200);
  });
});

describe("Request logging", () => {
  it("[FR-10.11] logs method, path, status and duration without cookie or auth content", async () => {
    const lines: string[] = [];
    const dest: pino.DestinationStream = {
      write(line: string) {
        lines.push(line);
      },
    };
    const loggingLogger = pino({ level: "info" }, dest);
    const app = createApp(TEST_CONFIG, loggingLogger, webDistPath);

    await request(app)
      .get("/api/health")
      .set("Cookie", "session=supersecret-value")
      .set("Authorization", "Bearer token-secret-value")
      .expect(200);

    expect(lines.length).toBeGreaterThan(0);
    const lastLine = lines[lines.length - 1] ?? "{}";
    const entry = JSON.parse(lastLine) as Record<string, unknown>;

    expect(String((entry.req as Record<string, unknown>).id)).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect((entry.req as Record<string, unknown>).method).toBe("GET");
    expect((entry.req as Record<string, unknown>).url).toBe("/api/health");
    expect((entry.res as Record<string, unknown>).statusCode).toBe(200);
    expect(entry).toHaveProperty("responseTime");

    const logText = lines.join("\n");
    expect(logText).not.toContain("supersecret-value");
    expect(logText).not.toContain("token-secret-value");
  });
});

describe("Graceful shutdown", () => {
  it("[FR-11.3] closes the server cleanly", async () => {
    const app = createApp(TEST_CONFIG, SILENT_LOGGER, webDistPath);
    const server = app.listen(0);
    const exitFn = vi.fn();

    await new Promise<void>((resolve) => {
      gracefulShutdown(server, SILENT_LOGGER, (code) => {
        exitFn(code);
        resolve();
      });
    });

    expect(exitFn).toHaveBeenCalledWith(0);
  });
});
