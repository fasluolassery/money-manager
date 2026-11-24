import type { Config } from "../config.js";

/** The one config every API test starts from (DESIGN 10.8). Fake secrets; never used outside tests. */
export const TEST_CONFIG: Config = {
  NODE_ENV: "test",
  PORT: 3000,
  APP_URL: "http://localhost:3000",
  LOG_LEVEL: "silent",
  MONGODB_URI: "mongodb://localhost:27017",
  BETTER_AUTH_SECRET: "test-secret-test-secret-test-secret-0123",
  GOOGLE_CLIENT_ID: "test-google-client-id",
  GOOGLE_CLIENT_SECRET: "test-google-client-secret",
  RATE_LIMIT_API: 300,
  RATE_LIMIT_AUTH: 30,
};
