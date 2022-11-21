// For details on the google oauth2 flow, please check the following ressources:
//  - https://developers.google.com/identity/protocols/oauth2
//  - https://developers.google.com/oauthplayground/

// ----- Types
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import type { Provider, ProviderOptions } from "../../types";
import axios from "axios";

// Checking a valid tokenId for a result from Google will result in the following type
export type UserInfo = {
  errors?: string[] | undefined;
  email?: string;
  emailVerified?: boolean;
};

export type OAuthToken = {
  errors?: string[] | undefined;
  email?: string;
  emailVerified?: boolean;
};

export type GoogleTokenResponse = {
  access_token: string;
};

export type GoogleUserInfo = {
  email?: string;
  verified_email?: boolean;
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
    const verifiedPayload = await verifyGoogle(payload.proofs.code);
    let valid = !verifiedPayload.errors && verifiedPayload.emailVerified;
    console.log("geri verifiedPayload", verifiedPayload);
    console.log("geri valid", valid);
    return {
      valid: valid,
      error: verifiedPayload.errors,
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

  try {
    const url = `https://oauth2.googleapis.com/token?client_id=${clientId}&client_secret=${clientSecret}&code=${code}&grant_type=authorization_code&redirectUri=${redirectUri}`;
    console.log("url", url);

    // Exchange the code for an access token
    const tokenRequest = await axios.post(
      url,
      {},
      {
        headers: { Accept: "application/json" },
      }
    );

    const tokenResponse = tokenRequest.data as GoogleTokenResponse;
    console.log("tokenResponse", tokenResponse);
    return tokenResponse.access_token;
  } catch (error) {
    throw new Error("Error getting authentication token: " + error?.response?.data?.error_description);
  }
};

// Perform verification on shared google access token
export const verifyGoogle = async (code: string): Promise<UserInfo> => {
  // retrieve user's auth bearer token to authenticate client
  const accessToken = await requestAccessToken(code);

  try {
    // Now that we have an access token fetch the user details
    const userRequest = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    console.log("userRequest", userRequest);

    const userInfo: GoogleUserInfo = userRequest.data as GoogleUserInfo;

    console.log("userInfo", userInfo);
    return {
      email: userInfo?.email,
      emailVerified: userInfo?.verified_email,
    };
  } catch (error) {
    return {
      errors: [
        "Error getting user info",
        `Status ${error.response.status}: ${error.response.statusText}`,
        "Details: " + error?.response?.data?.error?.message,
      ],
    };
  }
};
