import { Redis } from "ioredis";

export const redis = new Redis(process.env.REDIS_URL as string);

// Log errors and connection success
redis.on("connect", () => {
  console.log("Connected to Redis");
});

redis.on("error", (err) => {
  console.error("Redis connection error:", err);
});
