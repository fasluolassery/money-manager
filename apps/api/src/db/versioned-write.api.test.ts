import { rmSync } from "node:fs";
import { INITIAL_RECORD_VERSION, toId, versionSchema } from "@money-manager/shared";
import type { Application } from "express";
import { ObjectId } from "mongodb";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import { createRespond } from "../respond.js";
import {
  type ApiTestContext,
  type ApiTestOptions,
  createApiTestContext,
} from "../test-support/api-app.js";
import { buildUserId } from "../test-support/builders.js";
import type { DbHandle } from "./client.js";
import { deleteOwnedVersioned, updateOwnedVersioned } from "./versioned-write.js";

const PROBE = "version_probe";
const respond = createRespond("test");

const patchBodySchema = z
  .object({
    version: versionSchema,
    name: z.string().min(1),
  })
  .strict();

const deleteBodySchema = z
  .object({
    version: versionSchema,
  })
  .strict();

const probeResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.number().int(),
});

function registerVersionProbe(userId: string): NonNullable<ApiTestOptions["registerApiRoutes"]> {
  return (app: Application, db: DbHandle) => {
    const collection = db.db.collection(PROBE);

    app.patch(
      "/api/v1/probe/versioned/:id",
      validate({ body: patchBodySchema }),
      async (req, res, next) => {
        try {
          const doc = await updateOwnedVersioned(
            collection,
            { id: req.params.id as string, userId, version: req.body.version },
            { name: req.body.name },
          );
          respond(res, probeResponseSchema, {
            id: toId(doc._id as ObjectId),
            name: doc.name as string,
            version: doc.version as number,
          });
        } catch (error) {
          next(error);
        }
      },
    );

    app.delete(
      "/api/v1/probe/versioned/:id",
      validate({ body: deleteBodySchema }),
      async (req, res, next) => {
        try {
          await deleteOwnedVersioned(collection, {
            id: req.params.id as string,
            userId,
            version: req.body.version,
          });
          res.status(204).end();
        } catch (error) {
          next(error);
        }
      },
    );
  };
}

async function withVersionProbe(
  run: (ctx: ApiTestContext, userId: string, docId: ObjectId) => Promise<void>,
): Promise<void> {
  const userId = buildUserId();
  const ctx = await createApiTestContext({
    registerApiRoutes: registerVersionProbe(userId),
  });
  const docId = new ObjectId();
  await ctx.db.db.collection(PROBE).insertOne({
    _id: docId,
    userId,
    name: "original",
    version: INITIAL_RECORD_VERSION,
  });

  try {
    await run(ctx, userId, docId);
  } finally {
    await ctx.close();
    rmSync(ctx.webDistPath, { recursive: true, force: true });
  }
}

describe("versioned updates (DESIGN 4.7)", () => {
  it("[FR-9.10] two updates with the same version: first succeeds, second gets 409 STALE_RECORD", async () => {
    await withVersionProbe(async (ctx, _userId, docId) => {
      const id = docId.toHexString();
      const first = await request(ctx.app)
        .patch(`/api/v1/probe/versioned/${id}`)
        .send({ version: 1, name: "first" });
      expect(first.status).toBe(200);
      expect(first.body).toEqual({
        success: true,
        data: { id, name: "first", version: 2 },
      });

      const second = await request(ctx.app)
        .patch(`/api/v1/probe/versioned/${id}`)
        .send({ version: 1, name: "second" });
      expect(second.status).toBe(409);
      expect(second.body.success).toBe(false);
      expect(second.body.error.code).toBe("STALE_RECORD");
    });
  });

  it("[FR-9.10] a stale update changes nothing", async () => {
    await withVersionProbe(async (ctx, userId, docId) => {
      const id = docId.toHexString();
      await request(ctx.app)
        .patch(`/api/v1/probe/versioned/${id}`)
        .send({ version: 1, name: "kept" });

      await request(ctx.app)
        .patch(`/api/v1/probe/versioned/${id}`)
        .send({ version: 1, name: "should-not-apply" });

      const doc = await ctx.db.db.collection(PROBE).findOne({ _id: docId, userId });
      expect(doc).toMatchObject({ name: "kept", version: 2 });
    });
  });
});

describe("versioned deletes and validation (DESIGN 4.7)", () => {
  it("[FR-9.10] a missing version on update or delete returns 400", async () => {
    await withVersionProbe(async (ctx, _userId, docId) => {
      const id = docId.toHexString();
      const patch = await request(ctx.app)
        .patch(`/api/v1/probe/versioned/${id}`)
        .send({ name: "no-version" });
      expect(patch.status).toBe(400);
      expect(patch.body.error.code).toBe("VALIDATION_ERROR");
      expect(patch.body.error.details).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: "version" })]),
      );

      const del = await request(ctx.app).delete(`/api/v1/probe/versioned/${id}`).send({});
      expect(del.status).toBe(400);
      expect(del.body.error.code).toBe("VALIDATION_ERROR");
      expect(del.body.error.details).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: "version" })]),
      );
    });
  });

  it("[FR-9.10] delete with a stale version is rejected and the row remains", async () => {
    await withVersionProbe(async (ctx, userId, docId) => {
      const id = docId.toHexString();
      await request(ctx.app)
        .patch(`/api/v1/probe/versioned/${id}`)
        .send({ version: 1, name: "still-here" });

      const del = await request(ctx.app)
        .delete(`/api/v1/probe/versioned/${id}`)
        .send({ version: 1 });
      expect(del.status).toBe(409);
      expect(del.body.error.code).toBe("STALE_RECORD");

      expect(await ctx.db.db.collection(PROBE).countDocuments({ _id: docId, userId })).toBe(1);
    });
  });
});
