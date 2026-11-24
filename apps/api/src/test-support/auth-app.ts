import { randomUUID } from "node:crypto";
import { asValue } from "awilix";
import { betterAuth } from "better-auth";
import { testUtils } from "better-auth/plugins";
import type { Application } from "express";
import pino from "pino";
import { createApp } from "../app.js";
import { buildAuthOptions } from "../auth/auth.js";
import { type AuthCore, createAuthAdapter } from "../auth/auth-adapter.js";
import type { Config } from "../config.js";
import { createAppContainer } from "../container.js";
import { connectDb, type DbHandle } from "../db/client.js";
import { ensureIndexes } from "../db/indexes.js";
import { createTempWebDist } from "./api-app.js";
import { getMemoryMongoUri } from "./mongo-memory.js";
import { TEST_CONFIG } from "./test-config.js";

export type SignedInUser = {
  userId: string;
  /** Value for a `Cookie` request header. */
  cookie: string;
  sessionToken: string;
};

export type AuthTestContext = {
  app: Application;
  db: DbHandle;
  config: Config;
  /** Creates a user with a valid session, as Google sign-in would (DESIGN 10.8). */
  signIn: () => Promise<SignedInUser>;
  close: () => Promise<void>;
};

/**
 * The full app (container, Better Auth, `/api/v1` chain) on a fresh in-memory database.
 * Only Google is faked: Better Auth's test-only `testUtils` plugin creates the user and
 * session that a Google sign-in would, with a real signed cookie. `failingAuth` replaces
 * Better Auth for tests of how its failures reach the user (DESIGN 9.6).
 */
export async function createAuthTestContext(
  overrides: Partial<Config> = {},
  failingAuth?: AuthCore,
): Promise<AuthTestContext> {
  const uri = await getMemoryMongoUri();
  const db = await connectDb(uri, `t_${randomUUID().replaceAll("-", "")}`);
  await ensureIndexes(db.db);
  const config: Config = { ...TEST_CONFIG, MONGODB_URI: uri, ...overrides };
  const logger = pino({ level: "silent" });
  const testAuth = betterAuth({
    ...buildAuthOptions({ config, logger, db: db.db, mongoClient: db.client }),
    plugins: [testUtils()],
  });
  const container = createAppContainer({ config, logger, dbHandle: db });
  container.register({
    authAdapter: asValue(createAuthAdapter({ auth: failingAuth ?? testAuth })),
  });
  const app = createApp(config, logger, createTempWebDist(), {
    pingDb: () => db.ping(),
    container,
  });

  async function signIn(): Promise<SignedInUser> {
    const { test } = await testAuth.$context;
    const user = await test.saveUser(test.createUser());
    const { cookies, token } = await test.login({ userId: user.id });
    const cookie = cookies.map(({ name, value }) => `${name}=${value}`).join("; ");
    return { userId: user.id, cookie, sessionToken: token };
  }

  return { app, db, config, signIn, close: () => db.close() };
}
