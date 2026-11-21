import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createApp, gracefulShutdown } from "./app.js";
import { loadConfig } from "./config.js";
import { connectDb, type DbHandle, databaseNameFor } from "./db/client.js";
import { ensureIndexes } from "./db/indexes.js";
import { createLogger } from "./logger.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB_DIST_PATH = join(__dirname, "../../web/dist");

async function connectOrExit(
  uri: string,
  dbName: string,
  logger: ReturnType<typeof createLogger>,
): Promise<DbHandle> {
  try {
    return await connectDb(uri, dbName);
  } catch (error) {
    logger.error({ error }, "Failed to connect to MongoDB");
    process.exit(1);
  }
}

async function run(): Promise<void> {
  const config = loadConfig();
  const logger = createLogger(config);

  process.on("unhandledRejection", (reason) => {
    logger.error({ reason }, "Unhandled rejection");
    process.exit(1);
  });

  process.on("uncaughtException", (error) => {
    logger.error({ error }, "Uncaught exception");
    process.exit(1);
  });

  const db = await connectOrExit(config.MONGODB_URI, databaseNameFor(config.NODE_ENV), logger);
  await ensureIndexes(db.db);

  const app = createApp(config, logger, WEB_DIST_PATH, {
    pingDb: () => db.ping(),
  });

  const server = app.listen(config.PORT, () => {
    logger.info({ port: config.PORT }, "Server started");
  });

  process.on("SIGTERM", () => {
    gracefulShutdown(server, logger, {
      onClose: () => db.close(),
    });
  });
}

// Only start when this file is the process entry point, not when imported in tests.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  void run();
}
