// ----- Types
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import { ProviderExternalVerificationError, type Provider, type ProviderOptions } from "../../types";
import axios from "axios";
import { handleProviderAxiosError } from "../../utils/handleProviderAxiosError";
// import { handleProviderAxiosError } from "utils/handleProviderAxiosError";

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
    try {
      const errors: VerifiedPayload["errors"] = [];
      let valid = false,
        verifiedPayload: CoinbaseFindMyUserResponse = {},
        record = undefined;

      verifiedPayload = await verifyCoinbase(payload.proofs.code);
      valid = verifiedPayload && verifiedPayload.data && verifiedPayload.data.id ? true : false;

      if (valid) {
        record = {
          id: verifiedPayload.data.id,
        };
      } else {
        errors.push(`We could not verify your Coinbase account: ${verifiedPayload.data.id}.`);
      }
      return {
        valid,
        errors,
        record,
      };
    } catch (e: unknown) {
      throw new ProviderExternalVerificationError(`Coinbase account verification error: ${JSON.stringify(e)}`);
    }
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
  let userRequest;
  try {
    // retrieve user's auth bearer token to authenticate client
    const accessToken = await requestAccessToken(code);

    // Now that we have an access token fetch the user details
    userRequest = await axios.get("https://api.coinbase.com/v2/user", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (userRequest.status != 200) {
      throw `Get user request returned status code ${userRequest.status} instead of the expected 200`;
    }
  } catch (e) {
    const error = e as {
      response: {
        data: {
          error_description: string;
        };
      };
      request: string;
      message: string;
    };
    if (error.response) {
      throw `User GET request returned status code ${userRequest.status} instead of the expected 200`;
    } else if (error.request) {
      throw `A request was made, but no response was received: ${error.request}`;
    } else {
      throw `Error: ${error.message}`;
    }
    handleProviderAxiosError(e, "Coinbase access token request error", [code]);
  }
  return userRequest.data as CoinbaseFindMyUserResponse;
};
