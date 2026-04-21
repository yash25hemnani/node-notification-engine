import { Queue } from "bullmq";
import IORedis from "ioredis";
import { ENV } from "../config/env";

// Create new redis instance
export const redis = new IORedis({
  host: ENV.REDIS.HOST,
  port: ENV.REDIS.PORT,

  maxRetriesPerRequest: null, 
  enableReadyCheck: false,
});

// Create new bullmq Queue, with redis as the connection
export const notificationQueue = new Queue("notifications", {
  connection: redis,
});