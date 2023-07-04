import type { Provider } from "../../types";
import { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import { TwitterContext, getAuthClient } from "../procedures/twitterOauth";

// Perform verification on twitter access token
// async function verifyTwitterTweetDays(
//   sessionKey: string,
//   code: string,
//   context: TwitterContext
// ): Promise<number> {
//   const twitterClient = await getAuthClient(sessionKey, code, context);
//   const data = await getUserTweetDays(twitterClient);
//   return data;
// };

// export type TwitterTweetDaysOptions = {
//   threshold: string;
// };

// export class TwitterTweetDaysProvider implements Provider {
//   // The type will be determined dynamically, from the options passed in to the constructor
//   type = "";

//   constructor(options: TwitterTweetDaysOptions) {
//     this._options = { ...this._options, ...options };
//     this.type = `twitterTweetDaysGte#${this._options.threshold}`;
//   }
// };
