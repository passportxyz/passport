// ----- Types
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

// ----- Twitters OAuth2 library
import {
  getAuthClient,
  getTwitterUserData,
  TwitterContext,
  TwitterUserData,
} from "../../Twitter/procedures/twitterOauth.js";
import type { Provider, ProviderOptions } from "../../types.js";
// import { verifyTwitter } from "../providers/twitter";

// Export a Twitter Provider to carry out OAuth and return a record object
export class ClearTextTwitterProvider implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "ClearTextTwitter";
  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  // verify that the proof object contains valid === "true"
  async verify(payload: RequestPayload, context: TwitterContext): Promise<VerifiedPayload> {
    let valid = false,
      verifiedPayload: TwitterUserData = {},
      pii;

    try {
      verifiedPayload = await verifyUserTwitter(payload.proofs.sessionKey, payload.proofs.code, context);
    } catch (e) {
      return { valid: false };
    } finally {
      valid = verifiedPayload && verifiedPayload.username ? true : false;
      pii = verifiedPayload.username;
    }

    return {
      valid,
      record: {
        pii,
      },
    };
  }
}

async function verifyUserTwitter(sessionKey: string, code: string, context: TwitterContext): Promise<TwitterUserData> {
  const twitterClient = await getAuthClient(sessionKey, code, context);
  const myUser = await getTwitterUserData(context, twitterClient);

  return myUser;
}
