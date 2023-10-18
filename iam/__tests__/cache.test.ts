import { createClient, RedisClientType } from "redis";
import PassportCache from "../src/utils/cache"; // Import your PassportCache class

// Mock the Redis module with the methods you'll be using
jest.mock("redis", () => ({
  createClient: jest.fn().mockReturnValue({
    connect: jest.fn(),
    set: jest.fn(),
    get: jest.fn(),
    on: jest.fn(),
  }),
}));

describe("PassportCache", () => {
  let passportCache: PassportCache;
  let mockClient: jest.Mocked<RedisClientType>;

  beforeEach(() => {
    jest.clearAllMocks();
    passportCache = new PassportCache();

    mockClient = createClient() as jest.Mocked<RedisClientType>;
  });

  it("should initialize Redis client connection", async () => {
    await passportCache.init();
    expect(mockClient.connect).toHaveBeenCalled();
  });

  it("should set a key-value pair", async () => {
    await passportCache.set("some_key", "some_value");
    expect(mockClient.set).toHaveBeenCalledWith("some_key", "some_value");
  });

  it("should get a value by key", async () => {
    mockClient.get.mockResolvedValue("some_value");
    const value = await passportCache.get("some_key");
    expect(value).toEqual("some_value");
  });

  it("should handle Redis errors gracefully when setting", async () => {
    const consoleSpy = jest.spyOn(console, "error");
    mockClient.set.mockRejectedValue(new Error("Redis Error"));

    await passportCache.set("some_key", "some_value");

    expect(consoleSpy).toHaveBeenCalledWith("REDIS CONNECTION ERROR: Error writing to redis");
  });
});
