import { randomUUID } from "node:crypto";
import { type AwilixContainer, asValue } from "awilix";
import { betterAuth } from "better-auth";
import { testUtils } from "better-auth/plugins";
import type { Application } from "express";
import pino from "pino";
import { createApp } from "../app.js";
import { buildAuthOptions } from "../auth/auth.js";
import { type AuthCore, createAuthAdapter } from "../auth/auth-adapter.js";
import type { Clock } from "../clock.js";
import type { Config } from "../config.js";
import { type AppCradle, createAppContainer } from "../container.js";
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
  /** The app's container, for tests that call a service directly. */
  container: AwilixContainer<AppCradle>;
  /** Creates a user with a valid session, as Google sign-in would (DESIGN 10.8). */
  signIn: () => Promise<SignedInUser>;
  /**
   * Creates a user through Better Auth's own create path, so its after-user-created hook
   * runs, without a session (DESIGN 7.2).
   */
  createUser: () => Promise<{ userId: string }>;
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
  options: { clock?: Clock } = {},
): Promise<AuthTestContext> {
  const uri = await getMemoryMongoUri();
  const db = await connectDb(uri, `t_${randomUUID().replaceAll("-", "")}`);
  await ensureIndexes(db.db);
  const config: Config = { ...TEST_CONFIG, MONGODB_URI: uri, ...overrides };
  const logger = pino({ level: "silent" });
  const container = createAppContainer({ config, logger, dbHandle: db });
  if (options.clock !== undefined) container.register({ clock: asValue(options.clock) });
  // Same options as production, including the hook that runs `ensureProfile` (DESIGN 7.2).
  const testAuth = betterAuth({
    ...buildAuthOptions({
      config,
      logger,
      db: db.db,
      mongoClient: db.client,
      onUserCreated: (userId) => container.cradle.usersService.ensureProfile(userId),
    }),
    plugins: [testUtils()],
  });
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

  async function createUser(): Promise<{ userId: string }> {
    const { internalAdapter, test } = await testAuth.$context;
    const { name, email } = test.createUser();
    const user = await internalAdapter.createUser(
      { name, email, emailVerified: true },
      { method: "oauth", oauth: { providerId: "google" } },
    );
    return { userId: user.id };
  }

  return { app, db, config, container, signIn, createUser, close: () => db.close() };
}
