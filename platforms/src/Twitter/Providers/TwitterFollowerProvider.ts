// ----- Types
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

// ----- Twitters OAuth2 library
import { deleteClient, getClient, getFollowerCount, TwitterFollowerResponse } from "../procedures/twitterOauth";
import type { Provider, ProviderOptions } from "../../types";

// Perform verification on twitter access token and retrieve follower count
async function verifyTwitterFollowers(sessionKey: string, code: string): Promise<TwitterFollowerResponse> {
  const client = getClient(sessionKey);
  const data = await getFollowerCount(client, code);
  deleteClient(sessionKey);
  return data;
}

// Export a Provider to verify Twitter Followers Greater than 100
export class TwitterFollowerGT100Provider implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "TwitterFollowerGT100";
  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  // verify that the proof object contains valid === "true"
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    let valid = false;
    let data: TwitterFollowerResponse = {};
    let record: { [k: string]: string } = {};
    try {
      if (payload && payload.proofs) {
        data = await verifyTwitterFollowers(payload.proofs.sessionKey, payload.proofs.code);
        if (data.username && data.followerCount !== undefined && data.followerCount > 100) {
          valid = true;
          record = {
            username: data.username,
            followerCount: valid ? "gt100" : "",
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

// Export a Provider to verify Twitter Followers Greater than 500
export class TwitterFollowerGT500Provider implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "TwitterFollowerGT500";
  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  // verify that the proof object contains valid === "true"
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    let valid = false;
    let data: TwitterFollowerResponse = {};
    let record: { [k: string]: string } = {};

    try {
      if (payload && payload.proofs) {
        data = await verifyTwitterFollowers(payload.proofs.sessionKey, payload.proofs.code);
        if (data && data.username && data.followerCount) {
          valid = data.followerCount > 500;
          record = {
            username: data.username,
            followerCount: valid ? "gt500" : "",
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

// Export a Provider to verify Twitter Followers Greater than or equal to 1000
export class TwitterFollowerGTE1000Provider implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "TwitterFollowerGTE1000";
  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  // verify that the proof object contains valid === "true"
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    let valid = false;
    let data: TwitterFollowerResponse = {};
    let record: { [k: string]: string } = {};

    try {
      if (payload && payload.proofs) {
        data = await verifyTwitterFollowers(payload.proofs.sessionKey, payload.proofs.code);
        if (data && data.followerCount && data.username) {
          valid = data.followerCount >= 1000;
          record = {
            username: data.username,
            followerCount: valid ? "gte1000" : "",
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

// Export a Provider to verify Twitter Followers Greater than 5000
export class TwitterFollowerGT5000Provider implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "TwitterFollowerGT5000";
  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  // verify that the proof object contains valid === "true"
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    let valid = false;
    let data: TwitterFollowerResponse = {};
    let record: { [k: string]: string } = {};

    try {
      if (payload && payload.proofs) {
        data = await verifyTwitterFollowers(payload.proofs.sessionKey, payload.proofs.code);
        if (data && data.username && data.followerCount) {
          valid = data.followerCount > 5000;
          record = {
            username: data.username,
            followerCount: valid ? "gt5000" : "",
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
