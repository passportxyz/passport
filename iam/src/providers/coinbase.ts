// ----- Types
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import type { Provider, ProviderOptions } from "../types";
import axios from "axios";

export type CoinbaseTokenResponse = {
  access_token: string;
};

export type CoinbaseUserData = {
  id: string;
};

export type CoinbaseFindMyUserResponse = {
  data?: CoinbaseUserData;
};

export class CoinbaseProvider implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "Coinbase";

  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  // verify that the proof object contains valid === "true"
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    let valid = false,
      verifiedPayload: CoinbaseFindMyUserResponse = {};

    try {
      verifiedPayload = await verifyCoinbase(payload.proofs.code);
    } catch (e) {
      return { valid: false };
    } finally {
      valid = verifiedPayload && verifiedPayload.data && verifiedPayload.data.id ? true : false;
    }

    return {
      valid: valid,
      record: {
        id: verifiedPayload && verifiedPayload.data ? verifiedPayload.data.id : undefined,
      },
    };
  }
}

const requestAccessToken = async (code: string): Promise<string> => {
  const clientId = process.env.COINBASE_CLIENT_ID;
  const clientSecret = process.env.COINBASE_CLIENT_SECRET;
  const callback = process.env.COINBASE_CALLBACK;

  // Exchange the code for an access token
  const tokenRequest = await axios.post(
    `https://api.coinbase.com/oauth/token?grant_type=authorization_code&client_id=${clientId}&client_secret=${clientSecret}&code=${code}&redirect_uri=${callback}`,
    {},
    {
      headers: { Accept: "application/json" },
    }
  );

  if (tokenRequest.status != 200) {
    throw `Post for request returned status code ${tokenRequest.status} instead of the expected 200`;
  }

  const tokenResponse = tokenRequest.data as CoinbaseTokenResponse;

  return tokenResponse.access_token;
};

const verifyCoinbase = async (code: string): Promise<CoinbaseFindMyUserResponse> => {
  // retrieve user's auth bearer token to authenticate client
  const accessToken = await requestAccessToken(code);

  // Now that we have an access token fetch the user details
  const userRequest = await axios.get("https://api.coinbase.com/v2/user", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (userRequest.status != 200) {
    throw `Get user request returned status code ${userRequest.status} instead of the expected 200`;
  }

  return userRequest.data as CoinbaseFindMyUserResponse;
};
