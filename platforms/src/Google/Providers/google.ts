// For details on the google oauth2 flow, please check the following ressources:
//  - https://developers.google.com/identity/protocols/oauth2
//  - https://developers.google.com/oauthplayground/

// ----- Types
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import type { Provider, ProviderOptions } from "../../types";
import axios from "axios";

// Checking a valid tokenId for a result from Google will result in the following type
export type GoogleResponse = {
  email?: string;
  emailVerified?: boolean;
};

export type GoogleTokenResponse = {
  access_token: string;
};

// Export a Google Provider to carry out OAuth and return a record object
export class GoogleProvider implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "Google";
  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  // verify that the proof object contains valid === "true"
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    let valid = false,
      verifiedPayload: GoogleResponse = {};

    try {
      verifiedPayload = await verifyGoogle(payload.proofs.code);
    } catch (e) {
      return { valid: false };
    } finally {
      valid = verifiedPayload && verifiedPayload.emailVerified ? true : false;
    }

    return {
      valid: valid,
      record: {
        email: verifiedPayload.email,
      },
    };
  }
}

export const requestAccessToken = async (code: string): Promise<string> => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_CALLBACK;

  // Exchange the code for an access token
  const tokenRequest = await axios.post(
    `https://oauth2.googleapis.com/token?client_id=${clientId}&client_secret=${clientSecret}&code=${code}&grant_type=authorization_code&redirectUri=${redirectUri}`,
    {},
    {
      headers: { Accept: "application/json" },
    }
  );

  if (tokenRequest.status != 200) {
    throw `Post for request returned status code ${tokenRequest.status} instead of the expected 200`;
  }

  console.log(tokenRequest.data);
  const tokenResponse = tokenRequest.data as GoogleTokenResponse;

  return tokenResponse.access_token;
};

// Perform verification on shared google access token
export const verifyGoogle = async (code: string): Promise<GoogleResponse> => {
  // retrieve user's auth bearer token to authenticate client
  const accessToken = await requestAccessToken(code);

  // Now that we have an access token fetch the user details
  const userRequest = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return {
    email: userRequest.data.email,
    emailVerified: userRequest.data.verified_email,
  };
};
