import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createRespond } from "./respond.js";

function makeMockRes() {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  return {
    res: { status } as unknown as Parameters<ReturnType<typeof createRespond>>[0],
    status,
    json,
  };
}

const userSchema = z.object({ id: z.string(), name: z.string() });

describe("createRespond — strict mode (dev / test)", () => {
  const respond = createRespond("test");

  it("returns the success envelope with parsed data", () => {
    const { res, status, json } = makeMockRes();
    respond(res, userSchema, { id: "abc123", name: "Alice" });
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({ success: true, data: { id: "abc123", name: "Alice" } });
  });

  it("accepts a custom HTTP status code", () => {
    const { res, status } = makeMockRes();
    respond(res, userSchema, { id: "abc123", name: "Alice" }, 201);
    expect(status).toHaveBeenCalledWith(201);
  });

  it("[D-40] throws immediately if the data has a field the schema does not list", () => {
    const { res } = makeMockRes();
    const leaked = { id: "abc123", name: "Alice", userId: "user_xyz" };
    expect(() => respond(res, userSchema, leaked)).toThrow(/userId/);
  });

  it("[D-40] throwing for userId prevents the response from being sent", () => {
    const { res, json } = makeMockRes();
    try {
      respond(res, userSchema, { id: "1", name: "Bob", userId: "u1" });
    } catch {
      // expected
    }
    expect(json).not.toHaveBeenCalled();
  });

  it("[D-40] throws for other internal fields: nameLower, idempotencyKey, _id", () => {
    const { res } = makeMockRes();
    for (const field of ["nameLower", "idempotencyKey", "_id"]) {
      expect(() => respond(res, userSchema, { id: "1", name: "Bob", [field]: "leak" })).toThrow(
        new RegExp(field),
      );
    }
  });

  it("throws a ZodError when the data fails the schema (independent of extra-field check)", () => {
    const { res } = makeMockRes();
    expect(() => respond(res, userSchema, { id: 123, name: "Alice" })).toThrow();
  });
});

describe("createRespond — strip mode (production)", () => {
  it("[D-40] strips the unlisted field and sends only the schema fields", () => {
    const warn = vi.fn();
    const logger = { warn } as unknown as Parameters<typeof createRespond>[1];
    const respond = createRespond("production", logger);
    const { res, json } = makeMockRes();

    respond(res, userSchema, { id: "abc123", name: "Alice", userId: "user_xyz" });

    expect(json).toHaveBeenCalledWith({ success: true, data: { id: "abc123", name: "Alice" } });
    const sent = json.mock.calls[0]?.[0] as { data: object } | undefined;
    expect(sent?.data).not.toHaveProperty("userId");
  });

  it("[D-40] logs a warning when stripping occurs", () => {
    const warn = vi.fn();
    const logger = { warn } as unknown as Parameters<typeof createRespond>[1];
    const respond = createRespond("production", logger);
    const { res } = makeMockRes();

    respond(res, userSchema, { id: "1", name: "Bob", userId: "u1" });

    expect(warn).toHaveBeenCalledOnce();
  });

  it("[D-40] does not warn when no extra fields are present", () => {
    const warn = vi.fn();
    const logger = { warn } as unknown as Parameters<typeof createRespond>[1];
    const respond = createRespond("production", logger);
    const { res } = makeMockRes();

    respond(res, userSchema, { id: "1", name: "Bob" });

    expect(warn).not.toHaveBeenCalled();
  });
});
