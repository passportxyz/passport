// ----- Types
import type { Provider, ProviderOptions } from "../types";
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

// --- Api Library
import axios from "axios";
import { DateTime } from "luxon";

const APP_ID = process.env.FACEBOOK_APP_ID;
const APP_SECRET = process.env.FACEBOOK_APP_SECRET;

export type FacebookDebugResponse = {
  app_id?: string;
  type?: string;
  application?: string;
  data_access_expires_at?: number;
  expires_at?: number;
  is_valid?: boolean;
  scopes?: string[];
  user_id?: string;
};

// Facebook Graph API call response
type Response = {
  data?: { data: FacebookDebugResponse };
  status?: number;
  statusText?: string;
  headers?: {
    [key: string]: string;
  };
};

// Query Facebook graph api to verify the access token recieved from the user login is valid
export class FacebookProvider implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "Facebook";
  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  // verify that the proof object contains valid === "true"
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    try {
      const responseData = await verifyFacebook(payload.proofs.accessToken);
      const formattedData = responseData?.data.data;

      const notExpired = DateTime.now() < DateTime.fromSeconds(formattedData.expires_at);
      const valid: boolean =
        notExpired && formattedData.app_id === APP_ID && formattedData.is_valid && !!formattedData.user_id;

      return {
        valid,
        record: valid
          ? {
              user_id: formattedData.user_id,
            }
          : undefined,
      };
    } catch (e) {
      return { valid: false };
    }
  }
}

async function verifyFacebook(userAccessToken: string): Promise<Response> {
  // this is an alternative to generating an app auth token through a separate endpoint
  // see https://developers.facebook.com/docs/facebook-login/guides/access-tokens#generating-an-app-access-token
  const appAccessToken = `${APP_ID}|${APP_SECRET}`;
  return axios.get("https://graph.facebook.com/debug_token/", {
    headers: { "User-Agent": "Facebook Graph Client" },
    params: { access_token: appAccessToken, input_token: userAccessToken },
  });
}
