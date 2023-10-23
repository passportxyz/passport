import { PassportCache } from "../passport-cache";

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
    // eslint-disable-next-line prettier/prettier
    expect(JSON.stringify(await passportCache.getHash("some_hash"))).toBe(JSON.stringify({ someValue: "400" }));
  });
});
