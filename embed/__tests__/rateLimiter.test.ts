// ---- Testing libraries
import { jest, it, describe, expect, beforeEach } from "@jest/globals";
import { apiKeyRateLimit } from "../src/rateLimiter.js";
import axios from "axios";

import { parseRateLimit } from "../src/rateLimiter.js";

jest.mock(
  "../src/redis",
  () =>
    ({
      redis: {
        get: jest.fn(),
        set: jest.fn(),
        call: jest.fn(),
      },
    }) as any
);

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

beforeEach(() => {
  jest.clearAllMocks();
  const { redis } = require("../src/redis");
  redis.get.mockResolvedValue("");
  redis.set.mockResolvedValue(undefined);
});

describe("parseRateLimit", function () {
  it("parse non-empty valid string", async () => {
    expect(parseRateLimit("1000/1m")).toEqual(1000);
    expect(parseRateLimit("1000/1s")).toEqual(60000);
    expect(parseRateLimit("60/1h")).toEqual(1);
    expect(parseRateLimit("1440/1d")).toEqual(1);
    expect(parseRateLimit("")).toEqual(Infinity);
    expect(parseRateLimit(null)).toEqual(Infinity);
  });

  it("throws error when unsupported time unit is used", async () => {
    expect(() => parseRateLimit("1000/1x")).toThrow(
      new Error("Invalid rate limit spec format. Expected format: '<requests>/<time><unit> where unit is one of 'smhd'")
    );
    expect(() => parseRateLimit("abcd")).toThrow(
      new Error("Invalid rate limit spec format. Expected format: '<requests>/<time><unit> where unit is one of 'smhd'")
    );
  });
});

describe("apiKeyRateLimit", () => {
  const req = { headers: { "x-api-key": "test-key" } } as any;
  const res = {} as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("parses embed_rate_limit from API response", async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { embed_rate_limit: "100/10m" },
    });
    const limit = await apiKeyRateLimit(req, res);
    expect(limit).toBe(10); // 100 requests per 10 minutes = 10 per minute
  });

  it("throws if embed_rate_limit is missing", async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { some_other_key: "100/10m" },
    });
    await expect(apiKeyRateLimit(req, res)).rejects.toThrow();
  });
});
