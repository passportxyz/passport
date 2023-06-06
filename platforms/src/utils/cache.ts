import { PLATFORM_ID } from "@gitcoin/passport-types";
import { CacheToken } from "../types";
import crypto from "crypto";

export type CacheSession = Record<string, any>;

class PlatformsDataCache {
  cache: Record<CacheToken, Partial<Record<PLATFORM_ID, Record<string, any>>>> = {};

  timeouts: Record<CacheToken, NodeJS.Timeout> = {};

  // Initial timeout is a bit longer than the default timeout
  // to allow for user input in e.g. oauth flows
  initialTimeout: number = 1000 * 60 * 5; // 5 minutes
  timeout: number = 1000 * 60 * 3; // 3 minutes

  initSession(token?: CacheToken): CacheToken {
    const cacheToken = token || crypto.randomBytes(32).toString("hex");

    this.cache[cacheToken] = {};
    this._setTimeout(cacheToken, this.initialTimeout);

    return cacheToken;
  }

  clearSession(cacheToken: CacheToken, platform: PLATFORM_ID) {
    this._clearTimeout(cacheToken);
    if (this.cache[cacheToken]) {
      if (this.cache[cacheToken][platform]) {
        delete this.cache[cacheToken][platform];
      }
      if (Object.keys(this.cache[cacheToken]).length === 0) {
        delete this.cache[cacheToken];
      }
    }
  }

  loadSession<T>(token: CacheToken, platform: PLATFORM_ID): T {
    this._clearTimeout(token);

    if (!this.cache[token]) {
      throw new Error("Cache session not found");
    }

    if (!this.cache[token][platform]) {
      this.cache[token][platform] = {};
    }

    this._setTimeout(token);

    return this.cache[token][platform] as T;
  }

  _clearTimeout(cacheToken: CacheToken) {
    if (this.timeouts[cacheToken]) {
      clearTimeout(this.timeouts[cacheToken]);
      delete this.timeouts[cacheToken];
    }
  }

  _setTimeout(cacheToken: CacheToken, overrideTimeout?: number) {
    this.timeouts[cacheToken] = setTimeout(() => {
      delete this.cache[cacheToken];
      delete this.timeouts[cacheToken];
    }, overrideTimeout || this.timeout);
  }
}

const platformsDataCache = new PlatformsDataCache();

// Must be called to initiate a session
// A token is only needed if your platform requires the token to be in a
// specific format, otherwise a random token is automatically generated
export const initCacheSession = (token?: CacheToken): CacheToken => {
  return platformsDataCache.initSession(token);
};

// Right now the cache is only used by a single platform at a time,
// but the platform argument is used to support bulk requests in the future
export const loadCacheSession = <T>(cacheToken: CacheToken, platform: PLATFORM_ID): T => {
  return platformsDataCache.loadSession<T>(cacheToken, platform);
};

export const clearCacheSession = (cacheToken: CacheToken, platform: PLATFORM_ID) => {
  platformsDataCache.clearSession(cacheToken, platform);
};
