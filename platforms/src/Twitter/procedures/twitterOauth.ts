import {
  TwitterApi,
  TwitterApiReadOnly,
  ApiRequestError,
  ApiResponseError,
  ApiPartialResponseError,
} from "twitter-api-v2";

import { clearCacheSession, initCacheSession, loadCacheSession } from "../../utils/cache";
import { ProviderContext } from "@gitcoin/passport-types";
import { ProviderExternalVerificationError, ProviderInternalVerificationError } from "../../types";

export type TwitterContext = ProviderContext & {
  twitter?: {
    client?: TwitterApiReadOnly;
    userData?: TwitterUserData;
  };
};

type TwitterCache = {
  codeVerifier?: string;
};

export type TwitterUserData = {
  username?: string;
  createdAt?: string;
  id?: string;
};

export const loadTwitterCache = (token: string): TwitterCache => {
  try {
    return loadCacheSession(token, "Twitter");
  } catch (e) {
    throw new ProviderInternalVerificationError("Session missing or expired, try again");
  }
};

/**
 * Initializes a Twitter OAuth2 Authentication Client
 */
export const initClientAndGetAuthUrl = (): string => {
  if (process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET) {
    const client = new TwitterApi({
      clientId: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET,
    }).readOnly;

    const { url, codeVerifier, state } = client.generateOAuth2AuthLink(process.env.TWITTER_CALLBACK, {
      scope: ["tweet.read", "users.read"],
    });

    // This is necessary because of how we use the state to
    // direct the oauth window to the correct message channel
    const newState = "twitter-" + state;
    const newUrl = url.replace(state, newState);

    initCacheSession(newState);
    const session = loadTwitterCache(newState);

    session.codeVerifier = codeVerifier;

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
    const session = loadTwitterCache(sessionKey);
    const { codeVerifier } = session;

    if (!codeVerifier || !sessionKey || !code) {
      throw new ProviderExternalVerificationError("You denied the app or your session expired! Please try again.");
    }

    const client = await loginUser(code, codeVerifier);

    if (!context.twitter) context.twitter = {};
    context.twitter.client = client;

    clearCacheSession(sessionKey, "Twitter");
  }
  return context.twitter.client;
};

const loginUser = async (code: string, codeVerifier: string): Promise<TwitterApiReadOnly> => {
  throw new Error("Testing error alerts");
  const authClient = new TwitterApi({
    clientId: process.env.TWITTER_CLIENT_ID,
    clientSecret: process.env.TWITTER_CLIENT_SECRET,
  }).readOnly;

  try {
    const { client } = await authClient.loginWithOAuth2({
      code,
      codeVerifier,
      redirectUri: process.env.TWITTER_CALLBACK,
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
