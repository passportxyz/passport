// ---- Testing libraries
import { jest, it, describe, expect, beforeEach } from "@jest/globals";

import { parseRateLimit } from "../src/rateLimiter.js";

jest.mock("../src/redis", () => {
  return {
    redis: {
      call: async (...args: string[]): Promise<any> => Promise.resolve({}),
    },
  };
});

beforeEach(() => {
  // CLear the spy stats
  jest.clearAllMocks();
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
