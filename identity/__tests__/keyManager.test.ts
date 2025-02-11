import { getKeyVersions } from "../src/keyManager";

describe("Key management", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    for (const key of Object.keys(process.env)) {
      if (key.startsWith("IAM_JWK_EIP712_V")) {
        delete process.env[key];
      }
    }
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("loadKeyFromEnv", () => {
    it("should load a valid key configuration", () => {
      process.env.IAM_JWK_EIP712_V1 = "testkey123";
      process.env.IAM_JWK_EIP712_V1_START_TIME = "2024-01-01T00:00:00Z";

      const result = getKeyVersions();
      expect(result.initiatedKeyVersions).toHaveLength(1);
      expect(result.activeKeyVersions).toHaveLength(1);
      expect(result.initiatedKeyVersions[0]).toEqual({
        key: "testkey123",
        startTime: new Date("2024-01-01T00:00:00Z"),
        version: 1,
      });
      expect(result.issuerKeyVersion).toEqual(result.activeKeyVersions[0]);
    });

    it("should throw error for 0 keys", () => {
      delete process.env.IAM_JWK_EIP712_V1;
      delete process.env.IAM_JWK_EIP712_V1_START_TIME;

      expect(() => getKeyVersions()).toThrow("No valid keys configured");
    });

    it("should throw error for invalid start time", () => {
      process.env.IAM_JWK_EIP712_V1 = "testkey123";
      process.env.IAM_JWK_EIP712_V1_START_TIME = "invalid-date";

      expect(() => getKeyVersions()).toThrow("Invalid start time for key version 1");
    });
  });

  describe("KeyValidator", () => {
    it("should enforce monotonically increasing start times", () => {
      process.env.IAM_JWK_EIP712_V1 = "key1";
      process.env.IAM_JWK_EIP712_V1_START_TIME = "2024-01-01T00:00:00Z";
      process.env.IAM_JWK_EIP712_V2 = "key2";
      process.env.IAM_JWK_EIP712_V2_START_TIME = "2023-01-01T00:00:00Z"; // Earlier date

      expect(() => getKeyVersions()).toThrow(/Key version 2 start time .* must be after previous version/);
    });
  });

  describe("getKeyVersions", () => {
    it("should respect MAX_CONCURRENT_KEYS limit for active keys", () => {
      // Set up 3 valid keys
      process.env.IAM_JWK_EIP712_V3 = "key1";
      process.env.IAM_JWK_EIP712_V3_START_TIME = "2024-01-01T00:00:00Z";
      process.env.IAM_JWK_EIP712_V4 = "key2";
      process.env.IAM_JWK_EIP712_V4_START_TIME = "2024-01-02T00:00:00Z";
      process.env.IAM_JWK_EIP712_V5 = "key3";
      process.env.IAM_JWK_EIP712_V5_START_TIME = "2024-01-03T00:00:00Z";

      const result = getKeyVersions();
      expect(result.initiatedKeyVersions).toHaveLength(3);
      expect(result.activeKeyVersions).toHaveLength(2);
      expect(result.activeKeyVersions[0].key).toBe("key2");
      expect(result.activeKeyVersions[1].key).toBe("key3");
      expect(result.issuerKeyVersion.key).toBe("key2");
      expect(result.activeKeyVersions[1].version).toBe(5);
    });

    it("should stop at future keys", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      process.env.IAM_JWK_EIP712_V1 = "key1";
      process.env.IAM_JWK_EIP712_V1_START_TIME = "2024-01-01T00:00:00Z";
      process.env.IAM_JWK_EIP712_V2 = "key2";
      process.env.IAM_JWK_EIP712_V2_START_TIME = futureDate.toISOString();

      const result = getKeyVersions();
      expect(result.initiatedKeyVersions).toHaveLength(1);
      expect(result.activeKeyVersions).toHaveLength(1);
      expect(result.activeKeyVersions[0].key).toBe("key1");
      expect(result.issuerKeyVersion.key).toBe("key1");
    });

    it("should allow gaps in version numbers", () => {
      process.env.IAM_JWK_EIP712_V1 = "key1";
      process.env.IAM_JWK_EIP712_V1_START_TIME = "2024-01-01T00:00:00Z";
      process.env.IAM_JWK_EIP712_V3 = "key3";
      process.env.IAM_JWK_EIP712_V3_START_TIME = "2024-01-03T00:00:00Z";

      const result = getKeyVersions();
      expect(result.initiatedKeyVersions).toHaveLength(2);
      expect(result.activeKeyVersions).toHaveLength(2);
      expect(result.activeKeyVersions[0].key).toBe("key1");
      expect(result.activeKeyVersions[1].key).toBe("key3");
      expect(result.issuerKeyVersion.key).toBe("key1");
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
    let result = getKeyVersions();
    expect(result.initiatedKeyVersions).toHaveLength(3);
    expect(result.activeKeyVersions).toHaveLength(2);
    expect(result.activeKeyVersions.map((k) => k.key)).toEqual(["current-key-1", "current-key-2"]);
    expect(result.issuerKeyVersion.key).toBe("current-key-1");

    // Advance time by 7 hours (to 19:00)
    jest.setSystemTime(new Date("2024-02-10T19:00:00Z"));

    // Check keys again (should now be keys 3 and 4)
    result = getKeyVersions();
    expect(result.initiatedKeyVersions).toHaveLength(4);
    expect(result.activeKeyVersions).toHaveLength(2);
    expect(result.activeKeyVersions.map((k) => k.key)).toEqual(["current-key-2", "future-key"]);
    expect(result.issuerKeyVersion.key).toBe("current-key-2");

    jest.useRealTimers();
  });
});
