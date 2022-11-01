// ----- Types
import type { Provider, ProviderOptions } from "../../types";
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

// --- Api Library
import axios from "axios";
import { verifyFacebook } from "./facebook";
import { DateTime } from "luxon";

const APP_ID = process.env.FACEBOOK_APP_ID;

export type FacebookFriendsResponse = {
  data?: [];
  paging?: { before: string; after: string };
  summary?: { total_count?: number };
};

// Facebook Graph API call response
type Response = {
  data?: FacebookFriendsResponse;
  status?: number;
  statusText?: string;
  headers?: {
    [key: string]: string;
  };
};

// Query Facebook graph api to verify the number of friends
export class FacebookFriendsProvider implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "FacebookFriends";
  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  // verify that the proof object contains valid === "true"
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    try {
      // Calling the verifyFacebook here, because we also want to get the user id associated with the
      // user token that was provided (this we do not get from the friends request).
      // And in addition we also validated the user token
      const tokenResponseData = await verifyFacebook(payload.proofs.accessToken);

      if (tokenResponseData.status != 200) {
        // The exception handler will handle this
        throw tokenResponseData.statusText;
      }

      const formattedData = tokenResponseData?.data.data;

      const notExpired = DateTime.now() < DateTime.fromSeconds(formattedData.expires_at);
      const isTokenValid: boolean =
        notExpired && formattedData.app_id === APP_ID && formattedData.is_valid && !!formattedData.user_id;

      // Get the FB friends
      const friendsResponseData = await verifyFacebookFriends(payload.proofs.accessToken);

      if (friendsResponseData.status != 200) {
        // The exception handler will handle this
        throw friendsResponseData.statusText;
      }

      const friendsData = friendsResponseData?.data;

      const friendsCountGte100 = friendsData.summary.total_count >= 100;
      const valid = isTokenValid && friendsCountGte100;

      return {
        valid,
        record: valid
          ? {
              userId: formattedData.user_id,
              facebookFriendsGTE100: String(valid),
            }
          : undefined,
      };
    } catch (e) {
      return { valid: false };
    }
  }
}

async function verifyFacebookFriends(userAccessToken: string): Promise<Response> {
  // see https://developers.facebook.com/docs/graph-api/reference/user/friends/
  return axios.get("https://graph.facebook.com/me/friends/", {
    headers: { "User-Agent": "Facebook Graph Client" },
    params: { access_token: userAccessToken },
  });
}
