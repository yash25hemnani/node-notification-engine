import app from "./app";
import { ENV } from "./config/env";
import { initDB } from "./db";
import { logger } from "./utils/logger";

// Run Server
const startServer = async () => {
  await initDB();
  console.log(ENV.PORT)
  app.listen(ENV.PORT, () => {
    logger.info(`API running on http://localhost:${ENV.PORT}`);
  });
};

startServer();
