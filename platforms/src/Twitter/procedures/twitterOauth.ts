import { auth, Client } from "twitter-api-sdk";
import { clearCacheSession, initCacheSession, loadCacheSession } from "../../utils/cache";
import crypto from "crypto";
import { ProviderContext } from "@gitcoin/passport-types";
import { ProviderError } from "../../utils/errors";

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
    username?: string;
    authClient?: Client;
    createdAt?: string;
    id?: string;
  };
};

type TwitterCache = {
  oauthUser?: auth.OAuth2User;
};

export type TwitterUserData = {
  username?: string;
  createdAt?: string;
  id?: string;
  errors?: string[];
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
// OAuth2User instance. The correct state values need to be present when we request the access token
export const generateAuthURL = (client: auth.OAuth2User, state: string): string => {
  return client.generateAuthURL({
    state,
    code_challenge_method: "s256",
  });
};

export const getTwitterUserData = async (context: TwitterContext, twitterClient: Client): Promise<TwitterUserData> => {
  if (
    context.twitter.createdAt === undefined ||
    context.twitter.id === undefined ||
    context.twitter.username === undefined
  ) {
    try {
      // return information about the (authenticated) requesting user
      const user = await twitterClient.users.findMyUser();

      if (!context.twitter) context.twitter = {};

      context.twitter.createdAt = user.data.created_at;
      context.twitter.id = user.data.id;
      context.twitter.username = user.data.username;
      return {
        createdAt: context.twitter.createdAt,
        id: context.twitter.id,
      };
    } catch (_error) {
      const error = _error as ProviderError;
      if (error?.response?.status === 429) {
        return {
          errors: ["Error getting getting Twitter info", "Rate limit exceeded"],
        };
      }
      return {
        errors: ["Error getting getting Twitter info", `${error?.message}`],
      };
    }
  }
  return {
    createdAt: context.twitter.createdAt,
    id: context.twitter.id,
    username: context.twitter.username,
  };
};

// export const getUserAccountCreationDate = async (twitterClient: Client): Promise<string> => {
//   try {
//     // return information about the (authenticated) requesting user
//     const userAccountCreationDate = (await twitterClient.users.findMyUser()).data.created_at;

//     return userAccountCreationDate;

//   } catch (error) {

//   }
// };

export const getUserTweetTimeline = async (context: TwitterContext, twitterClient: Client): Promise<number> => {
  let nextToken: string | undefined;
  let tweetDays: Set<string>;
  const userId = context.twitter.id;
  // returns user tweet information
  do {
    const userTweetDaysResponse = await twitterClient.tweets.usersIdTweets(userId, {
      max_results: 100,
      pagination_token: nextToken,
      "tweet.fields": ["created_at"],
    });

    for (const tweet of userTweetDaysResponse.data) {
      // Extract date from created_at
      const date = new Date(tweet.created_at).toISOString().split("T")[0];
      tweetDays.add(date);
    }
    nextToken = userTweetDaysResponse.meta.next_token;
  } while (nextToken);

  return tweetDays.size;
};

// For everything after the initial user load, we need to avoid the secondary rate
// limit by waiting 1 second between requests
export const avoidTwitterRateLimit = async (): Promise<void> => {
  if (process.env.NODE_ENV === "test") return;

  await new Promise((resolve) => setTimeout(resolve, 1000));
};
