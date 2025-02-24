import { getKeyVersions } from "../src/keyManager";
import { checkRotatingKeysEnabled } from "../src/helpers";

jest.mock("../src/helpers", () => ({
  checkRotatingKeysEnabled: jest.fn().mockReturnValue(true),
}));

describe("Key management", () => {
  const originalEnv = process.env;
  const originalWarn = console.warn;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    for (const key of Object.keys(process.env)) {
      if (key.startsWith("IAM_JWK_EIP712")) {
        delete process.env[key];
      }
    }
    (checkRotatingKeysEnabled as jest.Mock).mockReturnValue(true);

    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation((message) => {
      if (
        !(message.includes("Warning: No legacy key") || message.includes("Warning: No valid IAM_JWK_EIP712_V* keys"))
      ) {
        originalWarn(message); // Let other warnings through
      }
    });
  });

  afterEach(() => {
    process.env = originalEnv;
    consoleWarnSpy.mockRestore();
  });

  describe("loadKeyFromEnv", () => {
    it("should load a valid key configuration", () => {
      process.env.IAM_JWK_EIP712_V1 = "testKey123";
      process.env.IAM_JWK_EIP712_V1_START_TIME = "2024-01-01T00:00:00Z";

      const result = getKeyVersions();
      expect(result.initiated).toHaveLength(1);
      expect(result.active).toHaveLength(1);
      expect(result.initiated[0]).toEqual({
        key: "testKey123",
        startTime: new Date("2024-01-01T00:00:00Z"),
        version: 1,
      });
      expect(result.issuer).toEqual(result.active[0]);
    });

    it("should throw error for 0 keys when rotating keys enabled", () => {
      delete process.env.IAM_JWK_EIP712;

      expect(() => getKeyVersions()).toThrow("No valid keys configured");
    });

    it("should throw error for invalid start time", () => {
      process.env.IAM_JWK_EIP712_V1 = "testKey123";
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
      expect(result.initiated).toHaveLength(3);
      expect(result.active).toHaveLength(2);
      expect(result.active[0].key).toBe("key2");
      expect(result.active[1].key).toBe("key3");
      expect(result.issuer.key).toBe("key2");
      expect(result.active[1].version).toBe(5);
    });

    it("should stop at future keys", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      process.env.IAM_JWK_EIP712_V1 = "key1";
      process.env.IAM_JWK_EIP712_V1_START_TIME = "2024-01-01T00:00:00Z";
      process.env.IAM_JWK_EIP712_V2 = "key2";
      process.env.IAM_JWK_EIP712_V2_START_TIME = futureDate.toISOString();

      const result = getKeyVersions();
      expect(result.initiated).toHaveLength(1);
      expect(result.active).toHaveLength(1);
      expect(result.active[0].key).toBe("key1");
      expect(result.issuer.key).toBe("key1");
    });

    it("should allow gaps in version numbers", () => {
      process.env.IAM_JWK_EIP712_V1 = "key1";
      process.env.IAM_JWK_EIP712_V1_START_TIME = "2024-01-01T00:00:00Z";
      process.env.IAM_JWK_EIP712_V3 = "key3";
      process.env.IAM_JWK_EIP712_V3_START_TIME = "2024-01-03T00:00:00Z";

      const result = getKeyVersions();
      expect(result.initiated).toHaveLength(2);
      expect(result.active).toHaveLength(2);
      expect(result.active[0].key).toBe("key1");
      expect(result.active[1].key).toBe("key3");
      expect(result.issuer.key).toBe("key1");
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
    expect(result.initiated).toHaveLength(3);
    expect(result.active).toHaveLength(2);
    expect(result.active.map((k) => k.key)).toEqual(["current-key-1", "current-key-2"]);
    expect(result.issuer.key).toBe("current-key-1");

    // Advance time by 7 hours (to 19:00)
    jest.setSystemTime(new Date("2024-02-10T19:00:00Z"));

    // Check keys again (should now be keys 3 and 4)
    result = getKeyVersions();
    expect(result.initiated).toHaveLength(4);
    expect(result.active).toHaveLength(2);
    expect(result.active.map((k) => k.key)).toEqual(["current-key-2", "future-key"]);
    expect(result.issuer.key).toBe("current-key-2");

    jest.useRealTimers();
  });

  describe("Legacy key support", () => {
    it("should work with just the legacy key when rotating keys disabled", () => {
      (checkRotatingKeysEnabled as jest.Mock).mockReturnValue(false);
      process.env.IAM_JWK_EIP712 = "legacy-key";

      const result = getKeyVersions();
      expect(result.initiated).toHaveLength(1);
      expect(result.active).toHaveLength(1);
      expect(result.initiated[0]).toEqual({
        key: "legacy-key",
        startTime: new Date(0),
        version: "0.0.0",
      });
      expect(result.issuer.key).toBe("legacy-key");
    });

    it("should work with legacy key + 1 new key", () => {
      process.env.IAM_JWK_EIP712 = "legacy-key";
      process.env.IAM_JWK_EIP712_V1 = "new-key";
      process.env.IAM_JWK_EIP712_V1_START_TIME = "2024-01-01T00:00:00Z";

      const result = getKeyVersions();
      expect(result.initiated).toHaveLength(2);
      expect(result.active).toHaveLength(2);
      expect(result.initiated[0]).toEqual({
        key: "legacy-key",
        startTime: new Date(0),
        version: "0.0.0",
      });
      expect(result.initiated[1].key).toBe("new-key");
      expect(result.issuer.key).toBe("legacy-key");
    });

    it("should properly rotate out the legacy key", () => {
      process.env.IAM_JWK_EIP712 = "legacy-key";
      process.env.IAM_JWK_EIP712_V1 = "key1";
      process.env.IAM_JWK_EIP712_V1_START_TIME = "2024-01-01T00:00:00Z";
      process.env.IAM_JWK_EIP712_V2 = "key2";
      process.env.IAM_JWK_EIP712_V2_START_TIME = "2024-01-02T00:00:00Z";

      const result = getKeyVersions();
      expect(result.initiated).toHaveLength(3);
      expect(result.active).toHaveLength(2);
      expect(result.active[0].key).toBe("key1");
      expect(result.active[1].key).toBe("key2");
      expect(result.issuer.key).toBe("key1");
      // Legacy key should not be in active keys
      expect(result.active.find((k) => k.key === "legacy-key")).toBeUndefined();
    });
  });
});
