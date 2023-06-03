// ----- Types
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

// ----- Twitters OAuth2 library
import { getClient, getTweetCount, TwitterTweetResponse } from "../procedures/twitterOauth";
import type { Provider, ProviderOptions } from "../../types";

// Perform verification on twitter access token and retrieve follower count
async function verifyTwitterTweets(sessionKey: string, code: string): Promise<TwitterTweetResponse> {
  const data = await getTweetCount(sessionKey, code);
  return data;
}

// This twitter stamp verifies if the user has more than 10 tweets/posts
export class TwitterTweetGT10Provider implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "TwitterTweetGT10";
  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  // verify that the proof object contains valid === "true"
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    let valid = false;
    let data: TwitterTweetResponse = {};
    let record: { [k: string]: string } | undefined = undefined;

    try {
      if (payload && payload.proofs) {
        data = await verifyTwitterTweets(payload.proofs.sessionKey, payload.proofs.code);
        if (data && data.username && data.tweetCount) {
          valid = data.tweetCount > 10;

          record = {
            username: data.username,
            tweetCount: valid ? "gt10" : "",
          };
        }
      }
    } catch (e) {
      return { valid: false };
    }

    return {
      valid: valid,
      record,
    };
  }
}
