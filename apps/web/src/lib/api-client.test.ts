// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiRequest } from "./api-client.js";

describe("apiRequest — success", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("[FR-3.5] unwraps a success envelope and returns data", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 200,
        json: async () => ({ success: true, data: { id: "1" } }),
      }),
    );
    const result = await apiRequest<{ id: string }>("/test");
    expect(result).toEqual({ id: "1" });
  });

  it("[FR-3.5] throws ApiError with code, message and details on a failure envelope", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 400,
        json: async () => ({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input",
            requestId: "req-1",
            details: [{ field: "amount", message: "Required" }],
          },
        }),
      }),
    );
    await expect(apiRequest("/test")).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      message: "Invalid input",
      requestId: "req-1",
      details: [{ field: "amount", message: "Required" }],
    });
  });
});

describe("apiRequest — 401 and timeout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("[FR-3.5] redirects to /sign-in on 401", async () => {
    Object.defineProperty(window, "location", { value: { href: "" }, writable: true });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 401,
        json: async () => ({
          success: false,
          error: { code: "UNAUTHENTICATED", message: "Sign in to continue." },
        }),
      }),
    );
    await expect(apiRequest("/test")).rejects.toBeInstanceOf(ApiError);
    expect(window.location.href).toBe("/sign-in");
  });

  it("[FR-3.5] times out after 15 s with NETWORK_ERROR and the UI.md 9.3 message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(
        (_url: string, init: RequestInit) =>
          new Promise((_resolve, reject) => {
            init.signal?.addEventListener("abort", () => {
              reject(new DOMException("The operation was aborted.", "AbortError"));
            });
          }),
      ),
    );
    const promise = apiRequest("/test");
    vi.advanceTimersByTime(15_000);
    const error = await promise.catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe("NETWORK_ERROR");
    expect((error as ApiError).message).toBe(
      "That took too long. Check your connection and try again.",
    );
  });
});

describe("apiRequest — network and parse errors", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("[FR-3.5] turns a fetch TypeError into NETWORK_ERROR without exposing the original message", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    const error = await apiRequest("/test").catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe("NETWORK_ERROR");
    expect((error as ApiError).message).not.toContain("Failed to fetch");
  });

  it("[FR-3.5] turns a non-envelope HTML 502 response into INTERNAL_ERROR without exposing proxy text", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 502,
        json: async () => {
          throw new SyntaxError("Unexpected token < in JSON");
        },
      }),
    );
    const error = await apiRequest("/test").catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe("INTERNAL_ERROR");
    expect((error as ApiError).message).not.toContain("Unexpected token");
  });
});
