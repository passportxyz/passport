import { initCacheSession, loadCacheSession, clearCacheSession } from "../mem-cache";
import crypto from "crypto";

// Mock the crypto.randomBytes function
jest.mock("crypto", () => ({
  randomBytes: jest.fn().mockReturnValue({
    toString: () => "mockedRandomToken",
  }),
}));

describe("PlatformsDataCache", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("initCacheSession should return a cache token", () => {
    const result = initCacheSession();
    expect(result).toBe("mockedRandomToken");
    expect(crypto.randomBytes).toHaveBeenCalledWith(32);
    clearCacheSession(result, "Github");
  });

  it("initCacheSession should return a provided cache token", () => {
    const result = initCacheSession("providedToken");
    expect(result).toBe("providedToken");
    expect(crypto.randomBytes).not.toHaveBeenCalled();
    clearCacheSession(result, "Github");
  });

  it("loadCacheSession should return session data", () => {
    const token = initCacheSession();
    const platform = "Github";
    const result = loadCacheSession(token, platform);
    expect(result).toEqual({});
    clearCacheSession(token, "Github");
  });

  it("loadCacheSession should throw an error if session not found", () => {
    const token = "nonexistentToken";
    const platform = "Github";
    expect(() => loadCacheSession(token, platform)).toThrow("Cache session not found");
  });

  it("clearCacheSession should clear a session if all providers cleared", () => {
    const token = initCacheSession();
    const platform = "Github";
    clearCacheSession(token, platform);
    expect(function () {
      loadCacheSession(token, platform);
    }).toThrow("Cache session not found");
  });

  it("clearCacheSession keep other providers when there are multiple", () => {
    type TestCache = { foo?: string };
    const token = initCacheSession();
    const platform1 = "Github";
    const platform2 = "Twitter";
    const session1: TestCache = loadCacheSession(token, platform1);
    const session2: TestCache = loadCacheSession(token, platform2);
    session1.foo = "bar";
    session2.foo = "baz";

    clearCacheSession(token, platform1);

    expect(loadCacheSession(token, platform2)).toEqual({ foo: "baz" });

    clearCacheSession(token, platform2);
  });

  it("loadCacheSession should throw an error if cache token is undefined", () => {
    const platform = "Github";
    expect(() => loadCacheSession(undefined, platform)).toThrow("Cache session not found");
  });

  it("initCacheSession should initialize separate sessions for different cache tokens", () => {
    const token1 = initCacheSession("token1");
    const token2 = initCacheSession("token2");
    const platform = "Github";

    // Expect both sessions to be initialized separately
    expect(loadCacheSession(token1, platform)).toEqual({});
    expect(loadCacheSession(token2, platform)).toEqual({});

    // Clear first session and expect only the first one to be cleared
    clearCacheSession(token1, platform);
    expect(() => loadCacheSession(token1, platform)).toThrow("Cache session not found");
    expect(loadCacheSession(token2, platform)).toEqual({});

    clearCacheSession(token2, platform);
  });
});
