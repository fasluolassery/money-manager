import { rmSync } from "node:fs";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { ConflictError } from "../errors.js";
import { type ApiTestContext, createApiTestContext } from "../test-support/api-app.js";
import { buildUserId } from "../test-support/builders.js";
import { crashMemoryMongo, getMemoryMongoUri } from "../test-support/mongo-memory.js";
import { connectDb } from "./client.js";
import { translateDriverError } from "./errors.js";
import { clearCollectionRegistrations, registerCollection } from "./indexes.js";
import { withTransaction } from "./transaction.js";

const PROBE = "probe_docs";
const UNIQUE_INDEX = "probe_name_unique";

function registerProbeCollection(): void {
  clearCollectionRegistrations();
  registerCollection({
    name: PROBE,
    indexes: [{ key: { name: 1 }, options: { unique: true, name: UNIQUE_INDEX } }],
    validator: {
      bsonType: "object",
      required: ["name", "userId"],
      properties: {
        name: { bsonType: "string" },
        userId: { bsonType: "string" },
      },
    },
  });
}

async function withCtx(run: (ctx: ApiTestContext) => Promise<void>): Promise<void> {
  registerProbeCollection();
  const ctx = await createApiTestContext();
  try {
    await run(ctx);
  } finally {
    clearCollectionRegistrations();
    await ctx.close();
    rmSync(ctx.webDistPath, { recursive: true, force: true });
  }
}

describe("health and connectivity", () => {
  it("[FR-2.1][FR-9.9][FR-9.11][FR-9.12][FR-11.1] /api/health returns 200 when the database is reachable", async () => {
    await withCtx(async (ctx) => {
      const res = await request(ctx.app).get("/api/health");
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: "ok" });
    });
  });

  it("[FR-11.1] /api/health returns 503 when the database becomes unreachable", async () => {
    registerProbeCollection();
    const ctx = await createApiTestContext();
    expect((await request(ctx.app).get("/api/health")).status).toBe(200);

    await ctx.db.close();
    await crashMemoryMongo();

    const res = await request(ctx.app).get("/api/health");
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ status: "unavailable" });

    clearCollectionRegistrations();
    rmSync(ctx.webDistPath, { recursive: true, force: true });
    await getMemoryMongoUri();
  });

  it("[FR-2.1] connectDb refuses a bad URI (server would exit at boot)", async () => {
    await expect(
      connectDb("mongodb://127.0.0.1:1/?serverSelectionTimeoutMS=500", "nope"),
    ).rejects.toBeTruthy();
  });
});

describe("transactions and driver errors", () => {
  afterEach(() => {
    clearCollectionRegistrations();
  });

  it("[FR-11.1] withTransaction rolls back the first write when the second throws", async () => {
    await withCtx(async (ctx) => {
      const collection = ctx.db.db.collection(PROBE);
      const userId = buildUserId();

      await expect(
        withTransaction(ctx.db.client, async (session) => {
          await collection.insertOne({ name: "first", userId }, { session });
          throw new Error("force rollback");
        }),
      ).rejects.toThrow("force rollback");

      expect(await collection.countDocuments({ name: "first" })).toBe(0);
    });
  });

  it("[FR-2.1][FR-9.9] duplicate on a unique index becomes ConflictError, not a MongoDB error", async () => {
    await withCtx(async (ctx) => {
      const collection = ctx.db.db.collection(PROBE);
      const userId = buildUserId();
      await collection.insertOne({ name: "Food", userId });

      let driverError: unknown;
      try {
        await collection.insertOne({ name: "Food", userId });
      } catch (error) {
        driverError = error;
      }
      expect(driverError).toBeDefined();

      try {
        translateDriverError(driverError, {
          [UNIQUE_INDEX]: "A probe called Food already exists",
        });
        expect.unreachable("expected ConflictError");
      } catch (translated) {
        expect(translated).toBeInstanceOf(ConflictError);
        expect((translated as ConflictError).message).toBe("A probe called Food already exists");
        expect((translated as ConflictError).code).toBe("CONFLICT");
      }
    });
  });
});
