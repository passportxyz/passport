import { initCacheSession, loadCacheSession, clearCacheSession } from "../platform-cache.js";
import crypto from "crypto";

// Mock the crypto.randomBytes function
jest.mock("crypto", () => ({
  randomBytes: jest.fn().mockReturnValue({
    toString: () => "mockedRandomToken",
  }),
}));

describe("PlatformsDataCache", () => {
  afterEach(async () => {
    jest.clearAllMocks();
    await clearCacheSession("token1");
    await clearCacheSession("token2");
  });

  it("initCacheSession should return a cache token", async () => {
    const result = await initCacheSession();
    expect(result).toBe("mockedRandomToken");
    expect(crypto.randomBytes).toHaveBeenCalledWith(32);
    await clearCacheSession(result);
  });

  it("initCacheSession should return a provided cache token", async () => {
    const result = await initCacheSession("providedToken");
    expect(result).toBe("providedToken");
    expect(crypto.randomBytes).not.toHaveBeenCalled();
    await clearCacheSession(result);
  });

  it("loadCacheSession should return session data", async () => {
    const token = await initCacheSession();
    const result = await loadCacheSession(token);
    expect(result.data).toEqual({
      initiated: "true",
    });
    await clearCacheSession(token);
  });

  it("loadCacheSession should throw an error if session not found", async () => {
    const token = "nonexistentToken";
    await expect(async () => await loadCacheSession(token)).rejects.toThrow("Cache session not found");
  });

  it("clearCacheSession should clear a session if all providers cleared", async () => {
    const token = await initCacheSession();
    await clearCacheSession(token);
    await expect(async function async() {
      await loadCacheSession(token);
    }).rejects.toThrow("Cache session not found");
  });

  it("clearCacheSession keep other providers when there are multiple", async () => {
    type TestCache = { foo?: string };
    const token = await initCacheSession();
    const token1 = await initCacheSession("token1");
    const session1 = await loadCacheSession<TestCache>(token);
    const session2 = await loadCacheSession<TestCache>(token1);
    await session1.set("foo", "bar");
    await session2.set("foo", "baz");

    await clearCacheSession(token);

    const token1Session = await loadCacheSession<TestCache>(token1);
    expect(token1Session.data).toEqual({ foo: "baz", initiated: "true" });

    await clearCacheSession(token);
    await clearCacheSession(token1);
  });

  it("loadCacheSession should throw an error if cache token is undefined", async () => {
    await expect(async () => await loadCacheSession(undefined)).rejects.toThrow("Cache session not found");
  });

  it("initCacheSession should initialize separate sessions for different cache tokens", async () => {
    const token1 = await initCacheSession("token1");
    const token2 = await initCacheSession("token2");

    const session1Data = await loadCacheSession(token1);
    const session2Data = await loadCacheSession(token2);
    // Expect both sessions to be initialized separately
    expect(session1Data.data).toEqual({ initiated: "true" });
    expect(session2Data.data).toEqual({ initiated: "true" });

    // Clear first session and expect only the first one to be cleared
    await clearCacheSession(token1);
    await expect(async () => await loadCacheSession(token1)).rejects.toThrow("Cache session not found");
    const session2 = await loadCacheSession(token2);
    expect(session2.data).toEqual({ initiated: "true" });

    await clearCacheSession(token2);
  });
});
