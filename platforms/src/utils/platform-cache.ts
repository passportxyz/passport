import { CacheToken } from "../types";
import crypto from "crypto";
import { PassportCache } from "./passport-cache";

export type CacheSession = Record<string, string>;

export class PlatformSession<T extends Record<string, string>> {
  cache: PassportCache;
  token: CacheToken;
  data: T;

  constructor(cache: PassportCache, token: CacheToken, data: T) {
    this.cache = cache;
    this.token = token;
    this.data = data;
  }

  get(key: keyof T): T[keyof T] {
    return this.data[key];
  }

  async set(key: keyof T, value: T[keyof T]): Promise<void> {
    this.data[key] = value;
    await this.cache.setHash(this.token, key as string, value);
  }
}

class PlatformsDataCache {
  cache: PassportCache = new PassportCache();

  // Initial timeout is a bit longer than the default timeout
  // to allow for user input in e.g. oauth flows
  initialTimeout: number = 1000 * 60 * 5; // 5 minutes
  timeout: number = 1000 * 60 * 3; // 3 minutes

  async initSession(token?: CacheToken): Promise<CacheToken> {
    await this.cache.init();
    const cacheToken = token || crypto.randomBytes(32).toString("hex");
    await this.cache.setHash(cacheToken, "initiated", "true");

    await this.cache.setTimeOut(cacheToken, this.initialTimeout);

    return cacheToken;
  }

  async clearSession(cacheToken: CacheToken): Promise<void> {
    await this.cache.delete(cacheToken);
  }

  async loadSession<T extends Record<string, string>>(token: CacheToken): Promise<PlatformSession<T>> {
    const userCache = await this.cache.getHash(token);
    if (!userCache) {
      throw new Error("Cache session not found");
    }

    const session = new PlatformSession<T>(this.cache, token, userCache as T);

    await this.cache.setTimeOut(token, this.timeout);
    return session;
  }
}

const platformsDataCache = new PlatformsDataCache();

// Must be called to initiate a session
// A token is only needed if your platform requires the token to be in a
// specific format, otherwise a random token is automatically generated
export const initCacheSession = async (token?: CacheToken): Promise<CacheToken> => {
  return await platformsDataCache.initSession(token);
};

// Right now the cache is only used by a single platform at a time,
// but the platform argument is used to support bulk requests in the future
export const loadCacheSession = async <T extends Record<string, string>>(
  cacheToken: CacheToken
): Promise<PlatformSession<T>> => {
  return await platformsDataCache.loadSession(cacheToken);
};

export const clearCacheSession = async (cacheToken: CacheToken): Promise<void> => {
  await platformsDataCache.clearSession(cacheToken);
};
