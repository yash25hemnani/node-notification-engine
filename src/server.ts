import app from "./app";
import { ENV } from "./config/env";
import { initDB } from "./db";
import { logger } from "./utils/logger";

// Run Server
const startServer = async () => {
  await initDB();
  app.listen(ENV.PORT, () => {
    logger.info(`API running on port ${ENV.PORT}`);
  });
};

startServer();
