import { logger } from "./utils/logger";
import { initDB } from "./db/index";
// All workers start with this import
import "./queue/processors/notification.processor";

async function startWorker() {
  await initDB();
  logger.info("Worker started");
}

startWorker();
