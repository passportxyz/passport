import { auth, Client } from "twitter-api-sdk";
import { clearCacheSession, initCacheSession, loadCacheSession } from "../../utils/cache";
import crypto from "crypto";
import { ProviderContext } from "@gitcoin/passport-types";

/*
  Procedure to generate auth URL & request access token for Twitter OAuth

  We MUST use the same instance/object of OAuth2User during generateAuthUrl AND requestAccessToken (bearer token) processes.
  This is because there are private values (code_challenge, code_verifier) that are
    set in the OAuth2User instance when generateAuthUrl action is performed -- these private values are used
    during the requestAccessToken process.
*/

export const generateSessionKey = (): string => {
  return `twitter-${crypto.randomBytes(32).toString("hex")}`;
};

export type TwitterContext = ProviderContext & {
  twitter?: {
    authClient?: Client;
  };
};

type TwitterCache = {
  oauthUser?: auth.OAuth2User;
};

const loadTwitterCache = (token: string): TwitterCache => loadCacheSession(token, "Twitter");

/**
 * Initializes a Twitter OAuth2 Authentication Client
 * @param callback redirect URI to use. Don’t use localhost as a callback URL - instead, please use a custom host locally or http(s)://127.0.0.1
 * @param sessionKey associates a specific auth.OAuth2User instance to a session
 * @returns instance of auth.OAuth2User
 */
export const initClient = (callback: string, sessionKey: string): auth.OAuth2User => {
  if (process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET) {
    initCacheSession(sessionKey);
    const session = loadTwitterCache(sessionKey);
    const oauthUser = new auth.OAuth2User({
      client_id: process.env.TWITTER_CLIENT_ID,
      client_secret: process.env.TWITTER_CLIENT_SECRET,
      scopes: ["tweet.read", "users.read"],
      callback,
    });
    session.oauthUser = oauthUser;
    return oauthUser;
  } else {
    throw "Missing TWITTER_CLIENT_ID or TWITTER_CLIENT_SECRET";
  }
};

// retrieve the instantiated Client shared between Providers
export const getAuthClient = async (sessionKey: string, code: string, context: TwitterContext): Promise<Client> => {
  if (!context.twitter?.authClient) {
    const session = loadTwitterCache(sessionKey);
    const { oauthUser } = session;
    // retrieve user's auth bearer token to authenticate client
    await oauthUser.requestAccessToken(code);

    if (!context.twitter) context.twitter = {};
    context.twitter.authClient = new Client(oauthUser);

    clearCacheSession(sessionKey, "Twitter");
  }
  return context.twitter.authClient;
};

// This method has side-effects which alter unaccessible state on the
//   OAuth2User instance. The correct state values need to be present when we request the access token
export const generateAuthURL = (client: auth.OAuth2User, state: string): string => {
  return client.generateAuthURL({
    state,
    code_challenge_method: "s256",
  });
};

export type TwitterFindMyUserResponse = {
  id?: string;
  name?: string;
  username?: string;
};

export const requestFindMyUser = async (twitterClient: Client): Promise<TwitterFindMyUserResponse> => {
  // return information about the (authenticated) requesting user
  const myUser = await twitterClient.users.findMyUser();
  return { ...myUser.data };
};

export type TwitterFollowerResponse = {
  username?: string;
  followerCount?: number;
};

export const getFollowerCount = async (twitterClient: Client): Promise<TwitterFollowerResponse> => {
  // public metrics returns more data on user
  const myUser = await twitterClient.users.findMyUser({
    "user.fields": ["public_metrics"],
  });
  return {
    username: myUser.data?.username,
    followerCount: myUser.data?.public_metrics?.followers_count,
  };
};

export type TwitterTweetResponse = {
  username?: string;
  tweetCount?: number;
};

export const getTweetCount = async (twitterClient: Client): Promise<TwitterTweetResponse> => {
  // public metrics returns more data on user
  const myUser = await twitterClient.users.findMyUser({
    "user.fields": ["public_metrics"],
  });
  return {
    username: myUser.data?.username,
    tweetCount: myUser.data?.public_metrics?.tweet_count,
  };
};
