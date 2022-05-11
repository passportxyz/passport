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

export const deleteClient = (state: string): void => {
  delete clients[state];
};

export const getClient = (state: string): auth.OAuth2User | undefined => {
  return clients[state];
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
  // retrieve user's auth bearer token to authenticate client
  await client.requestAccessToken(code);

  // return information about the (authenticated) requesting user
  const twitterClient = new Client(client);
  const myUser = await twitterClient.users.findMyUser();
  return { ...myUser.data };
};
