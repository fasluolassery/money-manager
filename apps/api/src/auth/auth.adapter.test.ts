import { describe, expect, it, vi } from "vitest";
import { UnauthenticatedError } from "../errors.js";
import { createAuthAdapter } from "./auth.adapter.js";
import type { Auth } from "./auth.js";

function makeAuth(getSession: () => Promise<unknown>): Auth {
  return {
    api: { getSession },
  } as unknown as Auth;
}

const silentLogger = {
  error: vi.fn(),
} as unknown as import("pino").Logger;

describe("createAuthAdapter", () => {
  it("[FR-2.3] returns the user id when Better Auth returns a valid session", async () => {
    const auth = makeAuth(async () => ({ user: { id: "user_abc123" } }));
    const adapter = createAuthAdapter({ auth, logger: silentLogger });

    const req = { headers: {} } as unknown as import("express").Request;
    await expect(adapter.getUserId(req)).resolves.toBe("user_abc123");
  });

  it("[FR-2.3] returns null when Better Auth returns no session", async () => {
    const auth = makeAuth(async () => null);
    const adapter = createAuthAdapter({ auth, logger: silentLogger });

    const req = { headers: {} } as unknown as import("express").Request;
    await expect(adapter.getUserId(req)).resolves.toBeNull();
  });

  it("[FR-2.3] translates a Better Auth internal error into UnauthenticatedError (DESIGN 9.6)", async () => {
    const auth = makeAuth(async () => {
      throw new Error("internal Better Auth failure");
    });
    const adapter = createAuthAdapter({ auth, logger: silentLogger });

    const req = { headers: {} } as unknown as import("express").Request;
    await expect(adapter.getUserId(req)).rejects.toBeInstanceOf(UnauthenticatedError);
    expect(silentLogger.error).toHaveBeenCalled();
  });
});
