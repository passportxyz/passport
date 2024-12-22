import Redis from "ioredis";

// Create a Redis client instance

// const client = new RedisClient()

export const redis = new Redis(process.env.REDIS_URL);
// Log errors and connection success
redis.on("connect", () => {
  console.log("Connected to Redis");
});

redis.on("error", (err) => {
  console.error("Redis connection error:", err);
});
