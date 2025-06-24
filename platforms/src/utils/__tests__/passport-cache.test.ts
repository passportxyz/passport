import { PassportCache } from "../passport-cache.js";

describe("PassportCache", () => {
  let passportCache: PassportCache;

  beforeEach(() => {
    passportCache = new PassportCache();
  });

  afterAll(async () => {
    await passportCache.disconnect();
  });

  it("should set a key-value pair", async () => {
    await passportCache.set("some_key", "some_value");
    expect(await passportCache.get("some_key")).toBe("some_value");
  });
  it("should set a key-value hash", async () => {
    await passportCache.setHash("some_key", "some_field", "400");

    expect(JSON.stringify(await passportCache.getHash("some_key"))).toBe(JSON.stringify({ some_field: "400" }));
  });
});
