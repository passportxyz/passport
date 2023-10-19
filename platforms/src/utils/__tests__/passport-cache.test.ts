import { createClient, RedisClientType } from "redis";
import { PassportCache } from "../plassport-cache";

jest.mock("redis", () => ({
  createClient: jest.fn().mockReturnValue({
    connect: jest.fn(),
    set: jest.fn(),
    get: jest.fn(),
    on: jest.fn(),
    hSet: jest.fn(),
    hGetAll: jest.fn(),
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

  it("should set a hash", async () => {
    const hashValue = { field1: "value1", field2: "value2" };
    await passportCache.setHash("some_hash_key", hashValue);
    expect(mockClient.hSet).toHaveBeenCalledWith("some_hash_key", hashValue);
  });

  it("should get a hash", async () => {
    const hashValue = { field1: "value1", field2: "value2" };
    mockClient.hGetAll.mockResolvedValue(hashValue);

    const value = await passportCache.getHash("some_hash_key");
    expect(value).toEqual(hashValue);
  });

  it("should handle Redis errors gracefully when getting hash", async () => {
    const consoleSpy = jest.spyOn(console, "error");
    mockClient.hGetAll.mockRejectedValue(new Error("Redis Error"));

    const value = await passportCache.getHash("some_hash_key");

    expect(consoleSpy).toHaveBeenCalledWith("REDIS CONNECTION ERROR: Error reading from redis");
    expect(value).toBeNull();
  });
});
