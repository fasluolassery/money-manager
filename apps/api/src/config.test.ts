import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadConfig } from "./config.js";

function withEnv(overrides: Record<string, string | undefined>, fn: () => void): void {
  const original: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(overrides)) {
    original[key] = process.env[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  try {
    fn();
  } finally {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

describe("loadConfig", () => {
  let exitSpy: ReturnType<typeof vi.spyOn>;
  let stderrSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });
    stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
  });

  afterEach(() => {
    exitSpy.mockRestore();
    stderrSpy.mockRestore();
  });

  it("[FR-10.6] parses valid environment variables", () => {
    withEnv({ APP_URL: "http://localhost:3000", NODE_ENV: "test", LOG_LEVEL: "silent" }, () => {
      const config = loadConfig();
      expect(config.APP_URL).toBe("http://localhost:3000");
      expect(config.NODE_ENV).toBe("test");
      expect(config.LOG_LEVEL).toBe("silent");
      expect(config.PORT).toBeTypeOf("number");
    });
  });

  it("[FR-10.6] exits with a message naming a missing required variable", () => {
    withEnv({ APP_URL: undefined }, () => {
      expect(() => loadConfig()).toThrow("process.exit called");
      expect(exitSpy).toHaveBeenCalledWith(1);
      const message = String(stderrSpy.mock.calls[0]?.[0] ?? "");
      expect(message).toContain("APP_URL");
    });
  });

  it("[FR-10.6] exits with a message naming an invalid variable", () => {
    withEnv({ APP_URL: "not-a-url" }, () => {
      expect(() => loadConfig()).toThrow("process.exit called");
      expect(exitSpy).toHaveBeenCalledWith(1);
      const message = String(stderrSpy.mock.calls[0]?.[0] ?? "");
      expect(message).toContain("APP_URL");
    });
  });

  it("[FR-10.6] applies defaults for optional variables", () => {
    withEnv({ APP_URL: "http://localhost:3000", NODE_ENV: undefined, LOG_LEVEL: undefined }, () => {
      const config = loadConfig();
      expect(config.NODE_ENV).toBe("development");
      expect(config.LOG_LEVEL).toBe("info");
      expect(config.PORT).toBe(3000);
    });
  });
});
