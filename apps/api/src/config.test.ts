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
  BETTER_AUTH_SECRET: "test-secret-32-chars-min-padding!",
  GOOGLE_CLIENT_ID: "google-client-id",
  GOOGLE_CLIENT_SECRET: "google-client-secret",
};

function useExitSpies() {
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
  return { getExitSpy: () => exitSpy, getStderrSpy: () => stderrSpy };
}

describe("loadConfig — environment validation", () => {
  const spies = useExitSpies();

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
      expect(spies.getExitSpy()).toHaveBeenCalledWith(1);
      const message = String(spies.getStderrSpy().mock.calls[0]?.[0] ?? "");
      expect(message).toContain("APP_URL");
    });
  });

  it("[FR-10.6] exits when MONGODB_URI is missing", () => {
    withEnv({ ...VALID_ENV, MONGODB_URI: undefined }, () => {
      expect(() => loadConfig()).toThrow("process.exit called");
      expect(spies.getExitSpy()).toHaveBeenCalledWith(1);
      const message = String(spies.getStderrSpy().mock.calls[0]?.[0] ?? "");
      expect(message).toContain("MONGODB_URI");
    });
  });

  it("[FR-10.6] exits with a message naming an invalid variable", () => {
    withEnv({ ...VALID_ENV, APP_URL: "not-a-url" }, () => {
      expect(() => loadConfig()).toThrow("process.exit called");
      expect(spies.getExitSpy()).toHaveBeenCalledWith(1);
      const message = String(spies.getStderrSpy().mock.calls[0]?.[0] ?? "");
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

describe("loadConfig — auth configuration guards", () => {
  const spies = useExitSpies();

  it("[FR-2.3] exits when BETTER_AUTH_SECRET is missing", () => {
    withEnv({ ...VALID_ENV, BETTER_AUTH_SECRET: undefined }, () => {
      expect(() => loadConfig()).toThrow("process.exit called");
      expect(spies.getExitSpy()).toHaveBeenCalledWith(1);
      const message = String(spies.getStderrSpy().mock.calls[0]?.[0] ?? "");
      expect(message).toContain("BETTER_AUTH_SECRET");
    });
  });

  it("[FR-2.3] exits when BETTER_AUTH_SECRET is shorter than 32 characters", () => {
    withEnv({ ...VALID_ENV, BETTER_AUTH_SECRET: "tooshort" }, () => {
      expect(() => loadConfig()).toThrow("process.exit called");
      expect(spies.getExitSpy()).toHaveBeenCalledWith(1);
    });
  });

  it("[FR-10.8] exits when E2E_AUTH=true in production", () => {
    withEnv({ ...VALID_ENV, NODE_ENV: "production", E2E_AUTH: "true" }, () => {
      expect(() => loadConfig()).toThrow("process.exit called");
      expect(spies.getExitSpy()).toHaveBeenCalledWith(1);
      const message = String(spies.getStderrSpy().mock.calls[0]?.[0] ?? "");
      expect(message).toContain("E2E_AUTH");
    });
  });

  it("[FR-10.8] allows E2E_AUTH=true in test environment", () => {
    withEnv({ ...VALID_ENV, NODE_ENV: "test", E2E_AUTH: "true" }, () => {
      const config = loadConfig();
      expect(config.E2E_AUTH).toBe(true);
    });
  });
});
