import { Request, Response } from "express";
import { redis } from "./redis.js";
import { RedisReply, RedisStore } from "rate-limit-redis";

import axios from "axios";
import { serverUtils } from "./utils/identityHelper.js";

const { ApiError } = serverUtils;

type RateLimitResponse = {
  embed_rate_limit?: string | null;
};

export function parseRateLimit(rateLimitSpec?: string | null): number {
  if (rateLimitSpec === "" || rateLimitSpec === null) {
    return Infinity;
  }

  // Regular expression to match the format "<requests>/<time>"
  const regex = /^(\d+)\/(\d+)([smhd])$/; // Supports seconds (s), minutes (m), hours (h), and days (d)
  const match = rateLimitSpec ? rateLimitSpec.match(regex) : null;

  if (!match) {
    throw new ApiError(
      "Invalid rate limit spec format. Expected format: '<requests>/<time><unit> where unit is one of 'smhd'",
      "400_BAD_REQUEST"
    );
  }

  const totalRequests = parseInt(match[1], 10); // e.g., 125
  const timeValue = parseInt(match[2], 10); // e.g., 15
  const timeUnit = match[3]; // e.g., 'm'

  // Convert time to minutes
  let timeInMinutes: number;
  switch (timeUnit) {
    case "s": // Seconds
      timeInMinutes = timeValue / 60;
      break;
    case "m": // Minutes
      timeInMinutes = timeValue;
      break;
    case "h": // Hours
      timeInMinutes = timeValue * 60;
      break;
    case "d": // Days
      timeInMinutes = timeValue * 1440;
      break;
    default:
      throw new ApiError("Invalid time unit. Supported units are: s, m, h, d", "400_BAD_REQUEST");
  }

  // Calculate rate limit per minute
  return totalRequests / timeInMinutes;
}

export async function apiKeyRateLimit(req: Request, _res: Response): Promise<number> {
  const apiKey = req.headers["x-api-key"] as string;
  const cacheKey = `erl:${apiKey}`;
  const cachedRateLimit = (await redis.get(cacheKey)) || "";
  const rateLimit = Number.parseFloat(cachedRateLimit);

  if (Number.isNaN(rateLimit)) {
    const { data } = await axios.get<RateLimitResponse>(
      `${process.env.SCORER_ENDPOINT}/internal/embed/validate-api-key`,
      {
        headers: {
          "X-API-KEY": apiKey,
        },
      }
    );

    const rateLimit = parseRateLimit(data.embed_rate_limit);

    // Cache the limit and set to expire in 5 minutes
    await redis.set(cacheKey, rateLimit, "EX", 5 * 60);

    // We will return the rate limit as limit / 1 minute
    return rateLimit;
  } else {
    return rateLimit;
  }
}

export function getRateLimiterStore(): RedisStore {
  return new RedisStore({
    sendCommand: async (...args: string[]): Promise<RedisReply> => {
      // @ts-expect-error - Known issue: the `call` function is not present in @types/ioredis
      return await redis.call(...args);
    },
  });
}
