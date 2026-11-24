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

const VALID_ENV = {
  APP_URL: "http://localhost:3000",
  MONGODB_URI: "mongodb://localhost:27017",
  NODE_ENV: "test",
  LOG_LEVEL: "silent",
  BETTER_AUTH_SECRET: "a".repeat(32),
  GOOGLE_CLIENT_ID: "client-id",
  GOOGLE_CLIENT_SECRET: "client-secret",
};

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

describe("loadConfig", () => {
  it("[FR-10.6] parses valid environment variables", () => {
    withEnv(VALID_ENV, () => {
      const config = loadConfig();
      expect(config.APP_URL).toBe("http://localhost:3000");
      expect(config.MONGODB_URI).toBe("mongodb://localhost:27017");
      expect(config.NODE_ENV).toBe("test");
      expect(config.LOG_LEVEL).toBe("silent");
      expect(config.PORT).toBeTypeOf("number");
    });
  });

  it("[FR-10.6] exits with a message naming a missing required variable", () => {
    withEnv({ ...VALID_ENV, APP_URL: undefined }, () => {
      expect(() => loadConfig()).toThrow("process.exit called");
      expect(exitSpy).toHaveBeenCalledWith(1);
      const message = String(stderrSpy.mock.calls[0]?.[0] ?? "");
      expect(message).toContain("APP_URL");
    });
  });

  it("[FR-10.6] exits when MONGODB_URI is missing", () => {
    withEnv({ ...VALID_ENV, MONGODB_URI: undefined }, () => {
      expect(() => loadConfig()).toThrow("process.exit called");
      expect(exitSpy).toHaveBeenCalledWith(1);
      const message = String(stderrSpy.mock.calls[0]?.[0] ?? "");
      expect(message).toContain("MONGODB_URI");
    });
  });

  it("[FR-10.6] exits with a message naming an invalid variable", () => {
    withEnv({ ...VALID_ENV, APP_URL: "not-a-url" }, () => {
      expect(() => loadConfig()).toThrow("process.exit called");
      expect(exitSpy).toHaveBeenCalledWith(1);
      const message = String(stderrSpy.mock.calls[0]?.[0] ?? "");
      expect(message).toContain("APP_URL");
    });
  });

  it("[FR-10.6] applies defaults for optional variables", () => {
    withEnv({ ...VALID_ENV, NODE_ENV: undefined, LOG_LEVEL: undefined }, () => {
      const config = loadConfig();
      expect(config.NODE_ENV).toBe("development");
      expect(config.LOG_LEVEL).toBe("info");
      expect(config.PORT).toBe(3000);
    });
  });
});

describe("loadConfig: auth and rate limits", () => {
  it("[FR-10.10] defaults the rate limits to 300 per user and 30 per IP", () => {
    withEnv({ ...VALID_ENV, RATE_LIMIT_API: undefined, RATE_LIMIT_AUTH: undefined }, () => {
      const config = loadConfig();
      expect(config.RATE_LIMIT_API).toBe(300);
      expect(config.RATE_LIMIT_AUTH).toBe(30);
    });
  });

  it("[FR-2.3] exits when the Google client or Better Auth secret is missing", () => {
    for (const name of ["BETTER_AUTH_SECRET", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"]) {
      stderrSpy.mockClear();
      withEnv({ ...VALID_ENV, [name]: undefined }, () => {
        expect(() => loadConfig()).toThrow("process.exit called");
        expect(String(stderrSpy.mock.calls[0]?.[0] ?? "")).toContain(name);
      });
    }
  });

  it("[FR-10.8] exits when BETTER_AUTH_SECRET is shorter than 32 characters", () => {
    withEnv({ ...VALID_ENV, BETTER_AUTH_SECRET: "too-short" }, () => {
      expect(() => loadConfig()).toThrow("process.exit called");
      expect(String(stderrSpy.mock.calls[0]?.[0] ?? "")).toContain("BETTER_AUTH_SECRET");
    });
  });
});
