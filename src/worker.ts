import { logger } from "./utils/logger";
import { initDB } from "./db/index";
// Start upon import
import { emailWorker, pushWorker } from "./queue/processors/notification.processor";

async function startWorker() {
  await initDB();
  logger.info("Worker started");
  logger.info("Email worker listening on email-queue");
  logger.info("Push worker listening on push-queue");
}

startWorker().catch((err) => {
  logger.error(err, "Failed to start worker");
  process.exit(1);
});