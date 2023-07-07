// ----- Types
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import type { Provider, ProviderOptions } from "../../types";
import axios from "axios";

export type AspectaTokenResponse = {
  access_token: string;
};

export type AspectaFindMyUserResponse = {
  username?: string;
  profile_url?: string;
  nickname?: string;
  avatar?: string;
  introduction?: string;
};

// Export a Aspecta Provider to carry out OAuth and return a record object
export class AspectaProvider implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "Aspecta";

  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  // verify that the proof object contains valid === "true"
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    let valid = false,
      verifiedPayload: AspectaFindMyUserResponse = {};

    try {
      verifiedPayload = await verifyAspecta(payload.proofs.code);
    } catch (e) {
      return { valid: false };
    } finally {
      valid = verifiedPayload && verifiedPayload.username ? true : false;
    }

    return {
      valid: valid,
      record: {
        username: verifiedPayload.username,
      },
    };
  }
}

const requestAccessToken = async (code: string): Promise<string> => {
  const clientId = process.env.ASPECTA_CLIENT_ID;
  const clientSecret = process.env.ASPECTA_CLIENT_SECRET;
  const redirectUri = process.env.ASPECTA_CALLBACK;

  try {
    // Exchange the code for an access token
    const tokenRequest = await axios.post(
      "https://oauth2.aspecta.id/token/",
      `grant_type=authorization_code&code=${code}&client_id=${clientId}&client_secret=${clientSecret}&redirect_uri=${redirectUri}`
    );

    if (tokenRequest.status != 200) {
      throw `Post for request returned status code ${tokenRequest.status} instead of the expected 200`;
    }

    const tokenResponse = tokenRequest.data as AspectaTokenResponse;

    return tokenResponse.access_token;
  } catch (e: unknown) {
    const error = e as { response: { data: { error_description: string } } };
    // eslint-disable-next-line no-console
    console.error("Error when verifying aspecta account for user:", error.response?.data);
    throw e;
  }
};

const verifyAspecta = async (code: string): Promise<AspectaFindMyUserResponse> => {
  // retrieve user's auth bearer token to authenticate client
  const accessToken = await requestAccessToken(code);

  // Now that we have an access token fetch the user details
  const userRequest = await axios.get("https://api.aspecta.id/v1/users/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (userRequest.status != 200) {
    throw `Get user request returned status code ${userRequest.status} instead of the expected 200`;
  }

  return userRequest.data as AspectaFindMyUserResponse;
};
