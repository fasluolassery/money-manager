import { describe, expect, it, vi } from "vitest";
import type { AuthAdapter } from "../auth/index.js";
import { UnauthenticatedError } from "../errors.js";
import { createRequireAuth } from "./require-auth.js";

function makeReq(headers: Record<string, string> = {}) {
  return { headers } as unknown as import("express").Request;
}

function makeRes() {
  return {} as unknown as import("express").Response;
}

describe("createRequireAuth", () => {
  it("[FR-10.7] sets req.userId and calls next() when the session is valid", async () => {
    const authAdapter: AuthAdapter = { getUserId: async () => "user_abc123" };
    const requireAuth = createRequireAuth({ authAdapter });

    const req = makeReq();
    const next = vi.fn();
    await requireAuth(req, makeRes(), next);

    expect(req.userId).toBe("user_abc123");
    expect(next).toHaveBeenCalledWith();
  });

  it("[FR-2.4] calls next(UnauthenticatedError) when there is no session", async () => {
    const authAdapter: AuthAdapter = { getUserId: async () => null };
    const requireAuth = createRequireAuth({ authAdapter });

    const req = makeReq();
    const next = vi.fn();
    await requireAuth(req, makeRes(), next);

    expect(req.userId).toBeUndefined();
    expect(next).toHaveBeenCalledWith(expect.any(UnauthenticatedError));
  });

  it("[FR-2.4] forwards any error thrown by the auth adapter to next()", async () => {
    const thrownError = new UnauthenticatedError("adapter failed");
    const authAdapter: AuthAdapter = {
      getUserId: async () => {
        throw thrownError;
      },
    };
    const requireAuth = createRequireAuth({ authAdapter });

    const req = makeReq();
    const next = vi.fn();
    await requireAuth(req, makeRes(), next);

    expect(next).toHaveBeenCalledWith(thrownError);
  });
});
