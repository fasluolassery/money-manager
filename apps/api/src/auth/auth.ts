import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { type BetterAuthOptions, betterAuth } from "better-auth";
import type pino from "pino";
import type { Config } from "../config.js";
import type { Db, MongoClient } from "../db/client.js";

const SECONDS_PER_DAY = 24 * 60 * 60;
/** Sliding expiry: 30 days without use, extended at most once a day (DESIGN 7.3, FR-10.8). */
const SESSION_EXPIRES_IN_SECONDS = 30 * SECONDS_PER_DAY;
const SESSION_UPDATE_AGE_SECONDS = SECONDS_PER_DAY;
/** `RATE_LIMIT_AUTH` requests per 5 minutes per IP on `/api/auth/*` (DESIGN 7.4). */
const AUTH_RATE_LIMIT_WINDOW_SECONDS = 5 * 60;

/**
 * The only header Better Auth reads the client IP from. `clientIpHeader` overwrites it
 * with Express's `req.ip` (`trust proxy` 1), so a client can't choose its own rate-limit
 * key with a forged `X-Forwarded-For` (DESIGN 7.4, Q-06).
 */
export const CLIENT_IP_HEADER = "x-app-client-ip";

export type AuthDeps = {
  config: Config;
  logger: pino.Logger;
  db: Db;
  mongoClient: MongoClient;
  /** Runs after Better Auth creates a user; first-sign-in setup lives here (DESIGN 7.2). */
  onUserCreated?: (userId: string) => Promise<void>;
};

/** Better Auth's settings (D-30, DESIGN 7). Tests build their instance from these too. */
export function buildAuthOptions({ config, logger, db, mongoClient, onUserCreated }: AuthDeps) {
  return {
    baseURL: config.APP_URL,
    secret: config.BETTER_AUTH_SECRET,
    trustedOrigins: [new URL(config.APP_URL).origin],
    // Passing the client makes Better Auth's own writes use transactions (Q-06).
    database: mongodbAdapter(db, { client: mongoClient }),
    socialProviders: {
      google: {
        clientId: config.GOOGLE_CLIENT_ID,
        clientSecret: config.GOOGLE_CLIENT_SECRET,
      },
    },
    session: {
      expiresIn: SESSION_EXPIRES_IN_SECONDS,
      updateAge: SESSION_UPDATE_AGE_SECONDS,
      // Every request checks the database, so logging out everywhere is immediate.
      cookieCache: { enabled: false },
    },
    rateLimit: {
      enabled: true,
      window: AUTH_RATE_LIMIT_WINDOW_SECONDS,
      max: config.RATE_LIMIT_AUTH,
      storage: "memory",
    },
    advanced: {
      useSecureCookies: config.NODE_ENV === "production",
      defaultCookieAttributes: { httpOnly: true, sameSite: "lax" },
      ipAddress: { ipAddressHeaders: [CLIENT_IP_HEADER] },
    },
    databaseHooks: {
      user: {
        create: {
          // A failed setup must not fail the sign-in: `requireAuth` repeats it (DESIGN 7.2).
          after: async (user: { id: string }) => {
            try {
              await onUserCreated?.(user.id);
            } catch (error) {
              logger.error({ error, userId: user.id }, "First sign-in setup failed");
            }
          },
        },
      },
    },
    // Only the message: Better Auth's extra arguments can hold emails or tokens (DESIGN 9.4).
    logger: {
      level: "warn",
      log: (level: "debug" | "info" | "warn" | "error", message: string) => {
        logger[level]({ source: "better-auth" }, message);
      },
    },
  } satisfies BetterAuthOptions;
}

export type CreateAuthDeps = Omit<AuthDeps, "onUserCreated"> & {
  usersService: { ensureProfile: (userId: string) => Promise<void> };
};

// Named dependencies, not a rest spread: the container's cradle must only resolve what is used.
export function createAuth({ config, logger, db, mongoClient, usersService }: CreateAuthDeps) {
  return betterAuth(
    buildAuthOptions({
      config,
      logger,
      db,
      mongoClient,
      onUserCreated: (userId) => usersService.ensureProfile(userId),
    }),
  );
}

export type Auth = ReturnType<typeof createAuth>;
