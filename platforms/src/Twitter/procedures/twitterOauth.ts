import { auth, Client } from "twitter-api-sdk";
import { loadCacheSession } from "../../utils/cache";

/*
  Procedure to generate auth URL & request access token for Twitter OAuth

  We MUST use the same instance/object of OAuth2User during generateAuthUrl AND requestAccessToken (bearer token) processes.
  This is because there are private values (code_challenge, code_verifier) that are
    set in the OAuth2User instance when generateAuthUrl action is performed -- these private values are used
    during the requestAccessToken process.
*/

/**
 * Initializes a Twitter OAuth2 Authentication Client
 * @param callback redirect URI to use. Don’t use localhost as a callback URL - instead, please use a custom host locally or http(s)://127.0.0.1
 * @param sessionKey associates a specific auth.OAuth2User instance to a session
 * @returns instance of auth.OAuth2User
 */
export const initClient = async (callback: string, sessionKey: string): Promise<auth.OAuth2User> => {
  if (process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET) {
    const session = loadCacheSession(sessionKey, "Twitter");
    const oauthUser = await session.get("oauthUser", async () => {
      return new auth.OAuth2User({
        client_id: process.env.TWITTER_CLIENT_ID,
        client_secret: process.env.TWITTER_CLIENT_SECRET,
        scopes: ["tweet.read", "users.read"],
        callback,
      });
    });
    return oauthUser;
  } else {
    throw "Missing TWITTER_CLIENT_ID or TWITTER_CLIENT_SECRET";
  }
};

// retrieve the raw client that is shared between Procedures
export const getClient = async (sessionKey: string): Promise<auth.OAuth2User> => {
  const session = loadCacheSession(sessionKey, "Twitter");
  const oauthUser = await session.get<auth.OAuth2User>("oauthUser");
  if (oauthUser) return oauthUser;
  throw "Unable to get twitter oauthUser";
};

// retrieve the instatiated Client shared between Providers
const getAuthClient = async (client: auth.OAuth2User, sessionKey: string): Promise<Client> => {
  const session = loadCacheSession(sessionKey, "Twitter");
  return await session.get("authClient", async () => {
    // retrieve user's auth bearer token to authenticate client
    await client.requestAccessToken(sessionKey);
    // associate and store the authedClient
    return new Client(client);
  });
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

export const requestFindMyUser = async (client: auth.OAuth2User, code: string): Promise<TwitterFindMyUserResponse> => {
  // return information about the (authenticated) requesting user
  const twitterClient = await getAuthClient(client, code);
  const myUser = await twitterClient.users.findMyUser();
  return { ...myUser.data };
};

export type TwitterFollowerResponse = {
  username?: string;
  followerCount?: number;
};

export const getFollowerCount = async (client: auth.OAuth2User, code: string): Promise<TwitterFollowerResponse> => {
  // retrieve user's auth bearer token to authenticate client
  const twitterClient = await getAuthClient(client, code);

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

export const getTweetCount = async (client: auth.OAuth2User, code: string): Promise<TwitterTweetResponse> => {
  // retrieve user's auth bearer token to authenticate client
  const twitterClient = await getAuthClient(client, code);

  // public metrics returns more data on user
  const myUser = await twitterClient.users.findMyUser({
    "user.fields": ["public_metrics"],
  });
  return {
    username: myUser.data?.username,
    tweetCount: myUser.data?.public_metrics?.tweet_count,
  };
};
