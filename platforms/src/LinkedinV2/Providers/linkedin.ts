// ----- Types
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import { ProviderExternalVerificationError, type Provider, type ProviderOptions } from "../../types";

// ----- Libs
import axios from "axios";

// ----- Utils
import { handleProviderAxiosError } from "../../utils/handleProviderAxiosError";

export type LinkedinTokenResponse = {
  access_token: string;
};

export type LinkedinV2FindMyUserResponse = {
  sub?: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  email?: string;
  error?: string;
};

export class LinkedinV2Provider implements Provider {
  type = "LinkedinV2";
  _options = {};

  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    const errors = [];
    let valid = false,
      verifiedPayload: LinkedinV2FindMyUserResponse = {},
      record = undefined;

    try {
      if (payload.proofs) {
        verifiedPayload = await verifyLinkedin(payload.proofs.code);
        valid = verifiedPayload && verifiedPayload.sub && verifiedPayload.email_verified ? true : false;

        if (valid) {
          record = {
            sub: verifiedPayload.sub,
          };
        } else {
          errors.push(`We were unable to verify your LinkedIn account -- LinkedIn Account Valid: ${String(valid)}.`);
        }
      } else {
        errors.push(verifiedPayload.error);
      }
      return {
        valid,
        record,
        errors,
      };
    } catch (e: unknown) {
      throw new ProviderExternalVerificationError(`LinkedIn Account verification error: ${JSON.stringify(e)}.`);
    }
  }
}

const requestAccessToken = async (code: string): Promise<string> => {
    try {
      const clientId = process.env.LINKEDIN_CLIENT_ID_V2;
      const clientSecret = process.env.LINKEDIN_CLIENT_SECRET_V2;

      const tokenRequest = await axios.post(
        `https://www.linkedin.com/oauth/v2/accessToken?grant_type=authorization_code&code=${code}&client_id=${clientId}&client_secret=${clientSecret}&redirect_uri=${process.env.LINKEDIN_CALLBACK}`,
        {},
        {
          headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
        }
      );

      if (tokenRequest.status != 200) {
        throw `Post for request returned status code ${tokenRequest.status} instead of the expected 200`;
      }

      const tokenResponse = tokenRequest.data as LinkedinTokenResponse;

      return tokenResponse.access_token;
    } catch (e: unknown) {
      handleProviderAxiosError(e, "LinkedIn access token request");
      return String(e);
    }
};

const verifyLinkedin = async (code: string): Promise<LinkedinV2FindMyUserResponse> => {
  try {
    const accessToken = await requestAccessToken(code);
    const userRequest = await axios.get("https://api.linkedin.com/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Linkedin-Version": 202305,
      },
    });
    
    return userRequest.data as LinkedinV2FindMyUserResponse;
  } catch (e: unknown) {
    handleProviderAxiosError(e, "LinkedIn verification", [code]);
    return e;
  }
};