import type { Provider } from "../../types";
import { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import { TwitterUserData, getTwitterUserData, TwitterContext, getAuthClient } from "../procedures/twitterOauth";

// Perform verification on twitter access token
async function verifyTwitterAccountAge(
  sessionKey: string,
  code: string,
  context: TwitterContext
): Promise<TwitterUserData> {
  const twitterClient = await getAuthClient(sessionKey, code, context);
  const data = await getTwitterUserData(context, twitterClient);
  return data;
}

export type TwitterAccountAgeOptions = {
  threshold: string;
};

const checkTwitterAccountAge = (numberOfDays: number, createdAt: string): boolean => {
  const creationDate = new Date(createdAt);
  // Get the current date
  const currentDate = new Date();
  // Calculate the difference in milliseconds
  const diffTime = Math.abs(currentDate.getTime() - creationDate.getTime());
  // Convert to days
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays >= numberOfDays;
};

export class TwitterAccountAgeProvider implements Provider {
  // The type will be determined dynamically, from the options passed in to the constructor
  type = "";

  _options = {
    threshold: "1",
  };

  constructor(options: TwitterAccountAgeOptions) {
    this._options = { ...this._options, ...options };
    this.type = `twitterAccountAgeGte#${this._options.threshold}`;
  }

  async verify(payload: RequestPayload, context: TwitterContext): Promise<VerifiedPayload> {
    const twitterUserData = await verifyTwitterAccountAge(payload.proofs.sessionKey, payload.proofs.code, context);
    const valid = checkTwitterAccountAge(parseInt(this._options.threshold), twitterUserData.createdAt);

    const twitterUserId = context.twitter.id;

    return {
      valid,
      error: twitterUserData.errors,
      record: valid ? { id: twitterUserId } : undefined,
    };
  }
}
