import { createApp } from "./app.js";
import { connectDatabase } from "./config/db.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";

async function main() {
  await connectDatabase();

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info(`PujariDekho API listening on port ${env.PORT} [${env.NODE_ENV}]`);
  });

  const shutdown = (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully`);
    server.close(() => process.exit(0));
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((error) => {
  logger.error("Failed to start server", error);
  process.exit(1);
});
