import { describe, expect, it, vi } from "vitest";
import type { Config } from "../config.js";
import { ForbiddenError } from "../errors.js";
import { createOriginCheck } from "./origin-check.js";

const APP_URL = "http://localhost:3000";
const TEST_CONFIG = { APP_URL } as Config;

function makeReq(method: string, origin?: string) {
  return {
    method,
    headers: origin !== undefined ? { origin } : {},
  } as unknown as import("express").Request;
}

function makeRes() {
  return {} as unknown as import("express").Response;
}

describe("createOriginCheck", () => {
  it("[FR-10.7] allows GET requests without an Origin header", () => {
    const originCheck = createOriginCheck({ config: TEST_CONFIG });
    const next = vi.fn();
    originCheck(makeReq("GET"), makeRes(), next);
    expect(next).toHaveBeenCalledWith();
  });

  it("[FR-10.7] allows POST requests from the app origin", () => {
    const originCheck = createOriginCheck({ config: TEST_CONFIG });
    const next = vi.fn();
    originCheck(makeReq("POST", APP_URL), makeRes(), next);
    expect(next).toHaveBeenCalledWith();
  });

  it("[FR-10.7] allows PATCH requests from the app origin", () => {
    const originCheck = createOriginCheck({ config: TEST_CONFIG });
    const next = vi.fn();
    originCheck(makeReq("PATCH", APP_URL), makeRes(), next);
    expect(next).toHaveBeenCalledWith();
  });

  it("[FR-10.7] allows DELETE requests from the app origin", () => {
    const originCheck = createOriginCheck({ config: TEST_CONFIG });
    const next = vi.fn();
    originCheck(makeReq("DELETE", APP_URL), makeRes(), next);
    expect(next).toHaveBeenCalledWith();
  });

  it("[FR-10.7] blocks POST requests from a different origin", () => {
    const originCheck = createOriginCheck({ config: TEST_CONFIG });
    const next = vi.fn();
    originCheck(makeReq("POST", "http://evil.example.com"), makeRes(), next);
    expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
  });

  it("[FR-10.7] blocks PATCH requests with no Origin header", () => {
    const originCheck = createOriginCheck({ config: TEST_CONFIG });
    const next = vi.fn();
    originCheck(makeReq("PATCH"), makeRes(), next);
    expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
  });

  it("[FR-10.7] blocks DELETE requests from a different origin", () => {
    const originCheck = createOriginCheck({ config: TEST_CONFIG });
    const next = vi.fn();
    originCheck(makeReq("DELETE", "http://attacker.example.com"), makeRes(), next);
    expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
  });

  it("[FR-10.7] allows PUT requests regardless of Origin (not a mutating method in this policy)", () => {
    const originCheck = createOriginCheck({ config: TEST_CONFIG });
    const next = vi.fn();
    originCheck(makeReq("PUT", "http://evil.example.com"), makeRes(), next);
    expect(next).toHaveBeenCalledWith();
  });
});
