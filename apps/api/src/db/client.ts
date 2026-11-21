import { type Db, MongoClient } from "mongodb";
import type { Config } from "../config.js";

/** Aggregation cursor option (DESIGN 15.6). */
export const AGGREGATION_MAX_TIME_MS = 10_000;

const SERVER_SELECTION_TIMEOUT_MS = 5_000;
const CONNECT_TIMEOUT_MS = 10_000;

export type DbHandle = {
  client: MongoClient;
  db: Db;
  ping: () => Promise<void>;
  close: () => Promise<void>;
};

/** Database name from environment (DESIGN 11.4). */
export function databaseNameFor(nodeEnv: Config["NODE_ENV"]): string {
  if (nodeEnv === "production") return "money-manager";
  if (nodeEnv === "test") return "money-manager-test";
  return "money-manager-dev";
}

// One MongoClient for the process; caller closes it on shutdown (DESIGN 5.1, 15.6).
export async function connectDb(uri: string, dbName: string): Promise<DbHandle> {
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS,
    connectTimeoutMS: CONNECT_TIMEOUT_MS,
  });
  await client.connect();
  const db = client.db(dbName);
  return {
    client,
    db,
    ping: async () => {
      await db.command({ ping: 1 });
    },
    close: async () => {
      await client.close();
    },
  };
}
