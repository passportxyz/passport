import type { Provider } from "../../types";
import { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import { TwitterContext, getAuthClient, getUserTweetTimeline, UserTweetTimeline } from "../procedures/twitterOauth";

// Perform verification on twitter access token
async function verifyTwitterTweetDays(
  sessionKey: string,
  code: string,
  context: TwitterContext
): Promise<UserTweetTimeline> {
  const twitterClient = await getAuthClient(sessionKey, code, context);
  const data = await getUserTweetTimeline(context, twitterClient);
  return data;
}

export type TwitterTweetDaysOptions = {
  threshold: string;
};

export class TwitterTweetDaysProvider implements Provider {
  // The type will be determined dynamically, from the options passed in to the constructor
  type = "";

  _options = {
    threshold: "1",
  };

  constructor(options: TwitterTweetDaysOptions) {
    this._options = { ...this._options, ...options };
    this.type = `twitterTweetDaysGte#${this._options.threshold}`;
  }

  async verify(payload: RequestPayload, context: TwitterContext): Promise<VerifiedPayload> {
    const twitterTweetData = await verifyTwitterTweetDays(payload.proofs.sessionKey, payload.proofs.code, context);

    const twitterUserId = context.twitter.id;
    const numberDaysTweeted = context.twitter.numberDaysTweeted;
    const valid = numberDaysTweeted >= parseInt(this._options.threshold);

    return {
      valid,
      error: twitterTweetData.errors,
      record: valid ? { id: twitterUserId } : undefined,
    };
  }
}
