import crypto from "crypto";
import { auth, Client } from "twitter-api-sdk";

/*
  Procedure to generate auth URL & request access token for Twitter OAuth

  We MUST use the same instance/object of OAuth2User during generateAuthUrl AND requestAccessToken (bearer token) processes.
  This is because there are private values (code_challenge, code_verifier) that are
    set in the OAuth2User instance when generateAuthUrl action is performed -- these private values are used
    during the requestAccessToken process.
*/

const TIMEOUT_IN_MS = 60000; // 60000ms = 60s

// Map <SessionKey, auth.OAuth2User>
export const clients: Record<string, auth.OAuth2User> = {};
export const authedClients: Record<string, Client> = {};

export const getSessionKey = (): string => {
  return `twitter-${crypto.randomBytes(32).toString("hex")}`;
};
/**
 * Initializes a Twitter OAuth2 Authentication Client
 * @param callback redirect URI to use. Don’t use localhost as a callback URL - instead, please use a custom host locally or http(s)://127.0.0.1
 * @param sessionKey associates a specific auth.OAuth2User instance to a session
 * @returns instance of auth.OAuth2User
 */
export const initClient = (callback: string, sessionKey: string): auth.OAuth2User => {
  clients[sessionKey] = new auth.OAuth2User({
    client_id: process.env.TWITTER_CLIENT_ID,
    client_secret: process.env.TWITTER_CLIENT_SECRET,
    callback: callback,
    scopes: ["tweet.read", "users.read"],
  });

  // stope the clients from causing a memory leak
  setTimeout(() => {
    deleteClient(sessionKey);
  }, TIMEOUT_IN_MS);

  return clients[sessionKey];
};

// record timeouts so that we can delay the deletion of the auth key til after all Providers have used it
const timeoutDel: { [key: string]: NodeJS.Timeout } = {};

export const deleteClient = (state: string): void => {
  timeoutDel[state] = setTimeout(() => {
    delete clients[state];
    delete timeoutDel[state];
  }, 10000);
};

export const getClient = (state: string): auth.OAuth2User | undefined => {
  clearTimeout(timeoutDel[state]);
  return clients[state];
};

const timeoutAuthDel: { [key: string]: NodeJS.Timeout } = {};

const deleteAuthClient = (code: string): void => {
  timeoutAuthDel[code] = setTimeout(() => {
    delete authedClients[code];
    delete timeoutAuthDel[code];
  }, 10000);
};

const getAuthClient = async (client: auth.OAuth2User, code: string): Promise<Client> => {
  let authedClient: Client;
  // retrieve user's auth bearer token to authenticate client
  if (authedClients[code]) {
    clearTimeout(timeoutAuthDel[code]);
    authedClient = authedClients[code];
  } else {
    await client.requestAccessToken(code);
    authedClient = authedClients[code] = new Client(client);
  }

  deleteAuthClient(code);

  return authedClient;
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
    username: myUser.data.username,
    followerCount: myUser.data.public_metrics.followers_count,
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
    username: myUser.data.username,
    tweetCount: myUser.data.public_metrics.tweet_count,
  };
};
