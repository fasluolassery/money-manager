import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createApp } from "./app.js";
import { loadConfig } from "./config.js";
import { createLogger } from "./logger.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB_DIST_PATH = join(__dirname, "../../web/dist");

function run(): void {
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

  const app = createApp(config, logger, WEB_DIST_PATH);

  const server = app.listen(config.PORT, () => {
    logger.info({ port: config.PORT }, "Server started");
  });

  process.on("SIGTERM", () => {
    logger.info("SIGTERM received, shutting down gracefully");
    server.close(() => {
      logger.info("Server closed");
      process.exit(0);
    });
  });
}

// Only start when this file is the process entry point, not when imported in tests.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  run();
}
