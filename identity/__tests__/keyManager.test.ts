import { getCurrentKeys } from "../src/keyManager";

describe("Key management", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("loadKeyFromEnv", () => {
    it("should load a valid key configuration", () => {
      process.env.IAM_JWK_EIP712_V1 = "testkey123";
      process.env.IAM_JWK_EIP712_V1_START_TIME = "2024-01-01T00:00:00Z";

      const result = getCurrentKeys();
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        key: "testkey123",
        startTime: new Date("2024-01-01T00:00:00Z"),
        version: 1,
      });
    });

    it("should return undefined for missing key", () => {
      delete process.env.IAM_JWK_EIP712_V1;
      delete process.env.IAM_JWK_EIP712_V1_START_TIME;

      expect(() => getCurrentKeys()).toThrow("No valid keys configured");
    });

    it("should throw error for invalid start time", () => {
      process.env.IAM_JWK_EIP712_V1 = "testkey123";
      process.env.IAM_JWK_EIP712_V1_START_TIME = "invalid-date";

      expect(() => getCurrentKeys()).toThrow("Invalid start time for key version 1");
    });
  });

  describe("KeyValidator", () => {
    it("should enforce monotonically increasing start times", () => {
      process.env.IAM_JWK_EIP712_V1 = "key1";
      process.env.IAM_JWK_EIP712_V1_START_TIME = "2024-01-01T00:00:00Z";
      process.env.IAM_JWK_EIP712_V2 = "key2";
      process.env.IAM_JWK_EIP712_V2_START_TIME = "2023-01-01T00:00:00Z"; // Earlier date

      expect(() => getCurrentKeys()).toThrow(/Key version 2 start time .* must be after previous version/);
    });
  });

  describe("getCurrentKeys", () => {
    it("should respect maxConcurrentKeys limit", () => {
      process.env.IAM_JWK_EIP712_NUM_CONCURRENT = "2";

      // Set up 3 valid keys
      process.env.IAM_JWK_EIP712_V3 = "key1";
      process.env.IAM_JWK_EIP712_V3_START_TIME = "2024-01-01T00:00:00Z";
      process.env.IAM_JWK_EIP712_V4 = "key2";
      process.env.IAM_JWK_EIP712_V4_START_TIME = "2024-01-02T00:00:00Z";
      process.env.IAM_JWK_EIP712_V5 = "key3";
      process.env.IAM_JWK_EIP712_V5_START_TIME = "2024-01-03T00:00:00Z";

      const result = getCurrentKeys();
      expect(result).toHaveLength(2);
      expect(result[0].key).toBe("key2");
      expect(result[1].key).toBe("key3");
      expect(result[1].version).toBe(5);
    });

    it("should stop at future keys", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      process.env.IAM_JWK_EIP712_V1 = "key1";
      process.env.IAM_JWK_EIP712_V1_START_TIME = "2024-01-01T00:00:00Z";
      process.env.IAM_JWK_EIP712_V2 = "key2";
      process.env.IAM_JWK_EIP712_V2_START_TIME = futureDate.toISOString();

      const result = getCurrentKeys();
      expect(result).toHaveLength(1);
      expect(result[0].key).toBe("key1");
    });

    it("should expect continuous versions", () => {
      process.env.IAM_JWK_EIP712_V1 = "key1";
      process.env.IAM_JWK_EIP712_V1_START_TIME = "2024-01-01T00:00:00Z";
      process.env.IAM_JWK_EIP712_V3 = "key3";
      process.env.IAM_JWK_EIP712_V3_START_TIME = "2024-01-03T00:00:00Z";

      const result = getCurrentKeys();
      expect(result).toHaveLength(1);
      expect(result[0].key).toBe("key1");
    });
  });

  it("should demonstrate key rotation over time", () => {
    // Mock current time to 2024-02-10T12:00:00Z
    const mockNow = new Date("2024-02-10T12:00:00Z");
    jest.useFakeTimers();
    jest.setSystemTime(mockNow);

    // Key 1: Started 2 days ago
    process.env.IAM_JWK_EIP712_V1 = "old-key";
    process.env.IAM_JWK_EIP712_V1_START_TIME = new Date("2024-02-08T12:00:00Z").toISOString();

    // Key 2: Started 1 day ago
    process.env.IAM_JWK_EIP712_V2 = "current-key-1";
    process.env.IAM_JWK_EIP712_V2_START_TIME = new Date("2024-02-09T12:00:00Z").toISOString();

    // Key 3: Started 6 hours ago
    process.env.IAM_JWK_EIP712_V3 = "current-key-2";
    process.env.IAM_JWK_EIP712_V3_START_TIME = new Date("2024-02-10T06:00:00Z").toISOString();

    // Key 4: Starts in 6 hours
    process.env.IAM_JWK_EIP712_V4 = "future-key";
    process.env.IAM_JWK_EIP712_V4_START_TIME = new Date("2024-02-10T18:00:00Z").toISOString();

    // Check current keys (should be keys 2 and 3)
    let result = getCurrentKeys();
    expect(result).toHaveLength(2);
    expect(result.map((k) => k.key)).toEqual(["current-key-1", "current-key-2"]);

    // Advance time by 7 hours (to 19:00)
    jest.setSystemTime(new Date("2024-02-10T19:00:00Z"));

    // Check keys again (should now be keys 3 and 4)
    result = getCurrentKeys();
    expect(result).toHaveLength(2);
    expect(result.map((k) => k.key)).toEqual(["current-key-2", "future-key"]);

    jest.useRealTimers();
  });
});
