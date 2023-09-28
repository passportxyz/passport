// ----- Types
import { ProviderExternalVerificationError, type Provider, type ProviderOptions } from "../../types";
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

// --- Api Library
import axios from "axios";
import { verifyFacebook } from "./facebook";
import { DateTime } from "luxon";
import { handleProviderAxiosError } from "../../utils/handleProviderAxiosError";

const APP_ID = process.env.FACEBOOK_APP_ID;

export type FacebookProfileResponse = {
  id: string;
  picture: {
    data: {
      is_silhouette: boolean;
    };
  };
};

// Facebook Graph API call response
type Response = {
  data?: FacebookProfileResponse;
  status?: number;
  statusText?: string;
  headers?: {
    [key: string]: string;
  };
};

// Query Facebook graph api to verify the profile picture
export class FacebookProfilePictureProvider implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "FacebookProfilePicture";
  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  // verify that the proof object contains valid === "true"
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    try {
      const errors = [];
      let record = undefined,
        valid = false,
        profileResponseData;
      // Calling the verifyFacebook here, because we also want to get the user id associated with the
      // user token that was provided (this we do not get from the friends request).
      // And in addition we also validated the user token

      const tokenResponseData = await verifyFacebook(payload.proofs.accessToken);

      const formattedData = tokenResponseData?.data.data;
      const notExpired = DateTime.now() < DateTime.fromSeconds(formattedData.expires_at);
      const isTokenValid: boolean =
        notExpired && formattedData.app_id === APP_ID && formattedData.is_valid && !!formattedData.user_id;

      if (formattedData.app_id !== APP_ID) {
        valid = false;
        errors.push("Received App ID does not match with Passport's App ID.");

        return {
          valid,
          record,
          errors,
        };
      }

      if (!formattedData.is_valid) {
        valid = false;
        errors.push("Invalid token");

        return {
          valid,
          record,
          errors,
        };
      }

      try {
        profileResponseData = await verifyFacebookProfilePic(payload.proofs.accessToken);
        if (profileResponseData.status !== 200) {
          errors.push("Error retrieving user profile.");
          return {
            valid,
            record,
            errors,
          };
        }
      } catch (error) {
        errors.push(error);
      }

      const profileData = profileResponseData?.data;

      if (profileData.picture === undefined) {
        valid = false;
        errors.push("Profile picture is unavailable.");

        return {
          valid,
          record,
          errors,
        };
      }

      // User has profile picture if is_silhouette is false
      const hasProfilePicture = !profileData.picture.data.is_silhouette;

      valid = isTokenValid && hasProfilePicture;
      if (valid) {
        // Get the FB profile
        record = {
          userId: profileData.id,
          hasProfilePicture: String(valid),
        };
      } else {
        errors.push("We were unable to verify your Facebook account profile picture.");
      }

      return {
        valid,
        record,
        errors,
      };
    } catch (e: unknown) {
      throw new ProviderExternalVerificationError(`Error verifying Facebook account: ${String(e)}`);
    }
  }
}

async function verifyFacebookProfilePic(userAccessToken: string): Promise<Response> {
  try {
    // see https://developers.facebook.com/docs/graph-api/reference/user/
    return axios.get("https://graph.facebook.com/me/", {
      headers: { "User-Agent": "Facebook Graph Client" },
      params: { access_token: userAccessToken, fields: "id,picture{is_silhouette}" },
    });
  } catch (error) {
    handleProviderAxiosError(error, "Facebook profile picture", [userAccessToken]);
  }
}
