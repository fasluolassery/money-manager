import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import type { Db, MongoClient } from "mongodb";
import type { Config } from "../config.js";

export type Auth = ReturnType<typeof createAuth>;

export function createAuth({
  config,
  db,
  mongoClient,
}: {
  config: Config;
  db: Db;
  mongoClient: MongoClient;
}) {
  return betterAuth({
    database: mongodbAdapter(db, { client: mongoClient }),
    secret: config.BETTER_AUTH_SECRET,
    baseURL: config.APP_URL,
    trustedOrigins: [config.APP_URL],
    session: {
      expiresIn: 60 * 60 * 24 * 30, // 30 days
      updateAge: 60 * 60 * 24, // extend at most once a day
      cookieCache: { enabled: false }, // always check DB (DESIGN D-47)
    },
    rateLimit: { enabled: true, max: 30, window: 300 }, // 30 req / 5 min on /api/auth/*
    socialProviders: {
      google: {
        clientId: config.GOOGLE_CLIENT_ID,
        clientSecret: config.GOOGLE_CLIENT_SECRET,
      },
    },
  });
}
