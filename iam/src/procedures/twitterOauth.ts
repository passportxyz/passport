import crypto from "crypto";
import { auth, Client } from "twitter-api-sdk";

/*
  Procedure to generate auth URL & request access token for Twitter OAuth

  We MUST use the same instance/object of OAuth2User during generateAuthUrl AND requestAccessToken (bearer token) processes.
  This is because there are private values (code_challenge, code_verifier) that are
    set in the OAuth2User instance when generateAuthUrl action is performed -- these private values are used
    during the requestAccessToken process.
*/

// Map <SessionKey, auth.OAuth2User>
export const clients: Record<string, auth.OAuth2User> = {};
export const authedClients: Record<string, Client> = {};

// Perform verification on twitter access token
export async function getAccessToken(code: string, context: { access_token?: string }): string {
  if (context.access_token) return context.access_token;
  const client = getClient(sessionKey);
  let myUser;
  if (client) {
    myUser = await requestFindMyUser(client, code);
    deleteClient(sessionKey);
    return myUser;
  }

  throw "Unable to determine twitter user";
}

export const getSessionKey = (): string => {
  return `twitter-${crypto.randomBytes(32).toString("hex")}`;
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
