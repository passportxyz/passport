import { Request, Response } from "express";
import { redis } from "./redis.js";
import axios from "axios";

function parseRateLimit(rateLimitSpec: string): number {
  // Regular expression to match the format "<requests>/<time>"
  const regex = /^(\d+)\/(\d+)([smhd])$/; // Supports seconds (s), minutes (m), hours (h), and days (d)
  const match = rateLimitSpec.match(regex);

  if (!match) {
    throw new Error("Invalid rate limit spec format. Expected format: '<requests>/<time><unit>'");
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
      throw new Error("Invalid time unit. Supported units are: s, m, h, d");
  }

  // Calculate rate limit per minute
  return totalRequests / timeInMinutes;
}

export async function apiKeyRateLimit(req: Request, res: Response): Promise<number> {
  try {
    const apiKey = req.headers["x-api-key"] as string;
    const cacheKey = `erl:${apiKey}`;
    const cachedRateLimit = await redis.get(cacheKey);
    const rateLimit = Number.parseFloat(cachedRateLimit);

    // Simulate an async operation (e.g., database call)
    if (Number.isNaN(rateLimit)) {
      const rateLimits = await axios.get(`${process.env.SCORER_ENDPOINT}/embed/validate-api-key`, {
        headers: {
          "X-API-KEY": apiKey,
        },
      });

      const rateLimitSpec = (rateLimits.data as { rate_limit: string })["rate_limit"];
      const rateLimit = parseRateLimit(rateLimitSpec);

      // Cache the limit and set to expire in 5 minutes
      await redis.set(cacheKey, rateLimit, "EX", 5 * 60);

      // We will return the rate limit as limit / 1 minute
      return rateLimit;
    } else {
      return rateLimit;
    }
  } catch (err) {
    console.error("Failed to get rate limit: ", err);
    throw err;
    // TODO: return the error ...
    // next(err); // Pass error to error-handling middleware
  }
}
