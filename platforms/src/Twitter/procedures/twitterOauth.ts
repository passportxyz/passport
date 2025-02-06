import {
  TwitterApi,
  TwitterApiReadOnly,
  ApiRequestError,
  ApiResponseError,
  ApiPartialResponseError,
} from "twitter-api-v2";

import { clearCacheSession, initCacheSession, loadCacheSession, PlatformSession } from "../../utils/platform-cache.js";
import { ProviderContext } from "@gitcoin/passport-types";
import { ProviderExternalVerificationError, ProviderInternalVerificationError } from "../../types.js";

export type TwitterContext = ProviderContext & {
  twitter?: {
    client?: TwitterApiReadOnly;
    userData?: TwitterUserData;
  };
};

type TwitterCache = {
  codeVerifier?: string;
  callback?: string;
};

export type TwitterUserData = {
  username?: string;
  createdAt?: string;
  id?: string;
};

export const loadTwitterCache = async (token: string): Promise<PlatformSession<TwitterCache>> => {
  try {
    return await loadCacheSession(token);
  } catch (e) {
    throw new ProviderInternalVerificationError("Session missing or expired, try again");
  }
};

/**
 * Initializes a Twitter OAuth2 Authentication Client
 */
export const initClientAndGetAuthUrl = async (callbackOverride?: string): Promise<string> => {
  if (process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET) {
    const callback = callbackOverride || process.env.TWITTER_CALLBACK;
    const client = new TwitterApi({
      clientId: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET,
    }).readOnly;

    const { url, codeVerifier, state } = client.generateOAuth2AuthLink(callback, {
      scope: ["tweet.read", "users.read"],
    });

    // This is necessary because of how we use the state to
    // direct the oauth window to the correct message channel
    const newState = "twitter-" + state;
    const newUrl = url.replace(state, newState);

    await initCacheSession(newState);
    const session = await loadTwitterCache(newState);

    await session.set("codeVerifier", codeVerifier);
    await session.set("callback", callback);

    return newUrl;
  } else {
    throw "Missing TWITTER_CLIENT_ID or TWITTER_CLIENT_SECRET";
  }
};

// retrieve the instantiated Client shared between Providers
export const getAuthClient = async (
  sessionKey: string,
  code: string,
  context: TwitterContext
): Promise<TwitterApiReadOnly> => {
  if (!context.twitter?.client) {
    const session = await loadTwitterCache(sessionKey);
    const codeVerifier = session.get("codeVerifier");
    const callback = session.get("callback");

    if (!codeVerifier || !sessionKey || !code) {
      throw new ProviderExternalVerificationError("You denied the app or your session expired! Please try again.");
    }

    const client = await loginUser(code, codeVerifier, callback);

    if (!context.twitter) context.twitter = {};
    context.twitter.client = client;

    await clearCacheSession(sessionKey);
  }
  return context.twitter.client;
};

const loginUser = async (code: string, codeVerifier: string, callback: string): Promise<TwitterApiReadOnly> => {
  const authClient = new TwitterApi({
    clientId: process.env.TWITTER_CLIENT_ID,
    clientSecret: process.env.TWITTER_CLIENT_SECRET,
  }).readOnly;

  try {
    const { client } = await authClient.loginWithOAuth2({
      code,
      codeVerifier,
      redirectUri: callback,
    });

    return client.readOnly;
  } catch (error) {
    handleTwitterSdkRequestError("auth", error);
  }
};

export const getTwitterUserData = async (
  context: TwitterContext,
  twitterClient: TwitterApiReadOnly
): Promise<TwitterUserData> => {
  if (!context.twitter.userData) {
    try {
      // return information about the (authenticated) requesting user
      const user = await twitterClient.v2.me({
        "user.fields": ["created_at"],
      });

      if (!context.twitter) context.twitter = {};
      if (!context.twitter.userData) context.twitter.userData = {};

      context.twitter.userData.createdAt = user.data.created_at;
      context.twitter.userData.id = user.data.id;
      context.twitter.userData.username = user.data.username;
    } catch (error) {
      handleTwitterSdkRequestError("user", error);
    }
  }
  return context.twitter.userData;
};

const handleTwitterSdkRequestError = (dataLabel: string, error: any): void => {
  if (error instanceof ApiRequestError) {
    const { requestError } = error;
    throw new ProviderExternalVerificationError(
      `Error requesting ${dataLabel} data: ${requestError.name} ${requestError.message}`
    );
  }

  if (error instanceof ApiResponseError) {
    const { data, code } = error;
    let dataString = "";
    try {
      dataString = JSON.stringify(data);
    } catch {}
    throw new ProviderExternalVerificationError(
      `Error retrieving ${dataLabel} data, code ${code}, data: ${dataString}`
    );
  }

  if (error instanceof ApiPartialResponseError) {
    const { rawContent, responseError } = error;
    throw new ProviderExternalVerificationError(
      `Retrieving Twitter ${dataLabel} data failed to complete, error: ${responseError.name} ${responseError.message}, raw data: ${rawContent}`
    );
  }

  throw error;
};
