import { z } from "zod";

const configSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  APP_URL: z.string().url(),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  MONGODB_URI: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(32),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  // Set to "true" in test environments only. config.ts refuses it in production (DESIGN 10.8).
  E2E_AUTH: z
    .string()
    .optional()
    .transform((v) => v === "true"),
});

export type Config = z.infer<typeof configSchema>;

export function loadConfig(): Config {
  const result = configSchema.safeParse(process.env);
  if (!result.success) {
    const fields = result.error.issues.map((issue) => issue.path.join(".")).join(", ");
    process.stderr.write(`Invalid or missing environment variable(s): ${fields}\n`);
    process.exit(1);
  }
  if (result.data.E2E_AUTH && result.data.NODE_ENV === "production") {
    process.stderr.write("E2E_AUTH must not be set in production\n");
    process.exit(1);
  }
  return result.data;
}
