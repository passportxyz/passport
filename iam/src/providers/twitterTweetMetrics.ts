// ----- Types
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

// ----- Twitters OAuth2 library
import { auth, Client } from "twitter-api-sdk";
import { deleteClient } from "../procedures/twitterOauth";
import type { Provider, ProviderOptions } from "../types";

// Map <SessionKey, auth.OAuth2User>
export const clients: Record<string, auth.OAuth2User> = {};

export const getClient = (state: string): auth.OAuth2User | undefined => {
  return clients[state];
};

export type TwitterTweetMetricResponse = {
  username?: string;
  isMoreThan?: boolean;
};

export type Metric = "like_count" | "retweet_count";

export const lookupTweetMetricCount = async (
  client: auth.OAuth2User,
  code: string,
  numberOfMetric: number,
  metric: Metric
): Promise<TwitterTweetMetricResponse> => {
  // retrieve user's auth bearer token to authenticate client
  await client.requestAccessToken(code);
  const twitterClient = new Client(client);

  // public metrics returns more data on user
  const myUser = await twitterClient.users.findMyUser();
  let isMoreThan = false;

  let tweetData = await twitterClient.tweets.usersIdTweets(myUser.data.id, {
    "tweet.fields": ["public_metrics"],
    max_results: 100,
    exclude: ["retweets", "replies"],
  });

  console.log("coool cool ", tweetData.meta);

  while (tweetData.meta.next_token) {
    tweetData = await twitterClient.tweets.usersIdTweets(myUser.data.id, {
      "tweet.fields": ["public_metrics"],
      pagination_token: tweetData.meta.next_token,
      max_results: 100,
      exclude: ["retweets", "replies"],
    });
    console.log("--> ", tweetData.meta);
    const metricCount = Math.max(...tweetData.data.map((tweet) => tweet.public_metrics[metric]));

    console.log("count --> ", metricCount);

    if (metricCount >= numberOfMetric) {
      isMoreThan = true;
      return;
    }
  }
  console.log("maxamount ", isMoreThan);
  return {
    username: myUser.data.username,
    isMoreThan,
  };
};

// Perform verification on twitter access token and retrieve follower count
async function verifyTwitterMetricCount(
  sessionKey: string,
  code: string,
  numberOfMetric: number,
  metric: Metric
): Promise<TwitterTweetMetricResponse> {
  const client = getClient(sessionKey);
  const data = await lookupTweetMetricCount(client, code, numberOfMetric, metric);
  deleteClient(sessionKey);
  return data;
}

// This twitter stamp verifies if a user has a tweet with more than or equal to 100 likes
export class TwitterTweetLikesGTE100Provider implements Provider {
  // Select from provider with payload
  type = "TwitterTweetLikesGTE100";
  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  // verify that the proof object contains valid === "true"
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    let valid = false;
    let data: TwitterTweetMetricResponse = {};

    try {
      data = await verifyTwitterMetricCount(payload.proofs.sessionKey, payload.proofs.code, 100, "like_count");
    } catch (e) {
      return { valid: false };
    } finally {
      valid = data.isMoreThan;
    }

    return {
      valid: valid,
      record: {
        username: data.username,
        tweetLikes: valid ? "tweetLikeGte100" : "",
      },
    };
  }
}

// This twitter stamp verifies if the user has a tweet/post with more than or equal 25 retweets
export class TwitterTweetRetweetsGTE25Provider implements Provider {
  // Select from provider with payload
  type = "TwitterTweetRetweetsGT25";
  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  // verify that the proof object contains valid === "true"
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    let valid = false;
    let data: TwitterTweetMetricResponse = {};

    try {
      data = await verifyTwitterMetricCount(payload.proofs.sessionKey, payload.proofs.code, 25, "retweet_count");
    } catch (e) {
      return { valid: false };
    } finally {
      valid = data.isMoreThan;
    }

    return {
      valid: valid,
      record: {
        username: data.username,
        tweetRetweets: valid ? "tweetRetweetsGte25" : "",
      },
    };
  }
}
