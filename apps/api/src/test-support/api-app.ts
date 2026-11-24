import { randomUUID } from "node:crypto";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Application } from "express";
import pino from "pino";
import { type CreateAppOptions, createApp } from "../app.js";
import type { Config } from "../config.js";
import { connectDb, type DbHandle } from "../db/client.js";
import { ensureIndexes } from "../db/indexes.js";
import { getMemoryMongoUri } from "./mongo-memory.js";
import { TEST_CONFIG } from "./test-config.js";

export const API_TEST_CONFIG: Config = TEST_CONFIG;

export function createTempWebDist(): string {
  const webDistPath = mkdtempSync(join(tmpdir(), "api-db-dist-"));
  mkdirSync(join(webDistPath, "assets"), { recursive: true });
  writeFileSync(join(webDistPath, "index.html"), "<!DOCTYPE html><html></html>");
  return webDistPath;
}

export type ApiTestContext = {
  app: Application;
  db: DbHandle;
  webDistPath: string;
  close: () => Promise<void>;
};

export type ApiTestOptions = Omit<CreateAppOptions, "pingDb" | "registerApiRoutes"> & {
  pingDb?: () => Promise<void>;
  /** Receives the connected db so probes can close over real collections. */
  registerApiRoutes?: (app: Application, db: DbHandle) => void;
};

// Fresh database per call against the shared in-memory replica set (DESIGN 10.8).
export async function createApiTestContext(options: ApiTestOptions = {}): Promise<ApiTestContext> {
  const uri = await getMemoryMongoUri();
  const dbName = `t_${randomUUID().replaceAll("-", "")}`;
  const db = await connectDb(uri, dbName);
  await ensureIndexes(db.db);
  const webDistPath = createTempWebDist();
  const config: Config = { ...API_TEST_CONFIG, MONGODB_URI: uri };
  const app = createApp(config, pino({ level: "silent" }), webDistPath, {
    pingDb: options.pingDb ?? (() => db.ping()),
    container: options.container,
    registerApiRoutes:
      options.registerApiRoutes !== undefined
        ? (app) => {
            options.registerApiRoutes?.(app, db);
          }
        : undefined,
  });
  return {
    app,
    db,
    webDistPath,
    close: async () => {
      await db.close();
    },
  };
}
