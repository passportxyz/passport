import { Redis } from "ioredis";
import { logger } from "./utils/logger.js";
export const redis = new Redis(process.env.REDIS_URL as string);

// Log errors and connection success
redis.on("connect", () => {
  logger.info("Connected to Redis");
});

redis.on("error", (err) => {
  logger.error("Redis connection error:", err);
});
