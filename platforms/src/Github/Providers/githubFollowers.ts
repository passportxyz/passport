// ----- Types
import type { ProviderContext, RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import type { Provider, ProviderOptions } from "../../types";
import { requestAccessToken } from "./github";

// ----- HTTP Client
import axios from "axios";

export type GithubTokenResponse = {
  access_token: string;
};

export type GithubFindMyUserResponse = {
  id?: string;
  login?: string;
  followers?: number;
  type?: string;
};

// Export a Github Provider to carry out OAuth, check if the user has 10 >= followers,
// and return an object verifying validity + a user record object
export class TenOrMoreGithubFollowers implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "TenOrMoreGithubFollowers";

  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  // verify that the proof object contains valid === "true"
  async verify(payload: RequestPayload, context: ProviderContext): Promise<VerifiedPayload> {
    let valid = false,
      verifiedPayload: GithubFindMyUserResponse = {};

    try {
      verifiedPayload = await verifyGithubFollowerCount(payload.proofs.code, context);
    } catch (e) {
      return { valid: false };
    } finally {
      valid = verifiedPayload && verifiedPayload.followers >= 10 && verifiedPayload.id ? true : false;
    }

    return {
      valid: valid,
      record: {
        id: verifiedPayload.id + "gte10GithubFollowers",
      },
    };
  }
}

// Export a Github Provider to carry out OAuth, check if the user has 50 >= followers,
// and return an object verifying validity + a user record object
export class FiftyOrMoreGithubFollowers implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "FiftyOrMoreGithubFollowers";

  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  // verify that the proof object contains valid === "true"
  async verify(payload: RequestPayload, context: ProviderContext): Promise<VerifiedPayload> {
    let valid = false,
      verifiedPayload: GithubFindMyUserResponse = {};

    try {
      verifiedPayload = await verifyGithubFollowerCount(payload.proofs.code, context);
    } catch (e) {
      return { valid: false };
    } finally {
      valid = verifiedPayload && verifiedPayload.followers >= 50 && verifiedPayload.id ? true : false;
    }

    return {
      valid: valid,
      record: {
        id: verifiedPayload.id + "gte50GithubFollowers",
      },
    };
  }
}

const verifyGithubFollowerCount = async (code: string, context: ProviderContext): Promise<GithubFindMyUserResponse> => {
  // retrieve user's auth bearer token to authenticate client
  const accessToken = await requestAccessToken(code, context);

  // Now that we have an access token fetch the user details
  const userRequest = await axios.get("https://api.github.com/user", {
    headers: { Authorization: `token ${accessToken}` },
  });

  if (userRequest.status != 200) {
    throw `Get user request returned status code ${userRequest.status} instead of the expected 200`;
  }
  return userRequest.data as GithubFindMyUserResponse;
};
