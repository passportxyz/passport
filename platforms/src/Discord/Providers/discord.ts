// ----- Types
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import { ProviderExternalVerificationError, type Provider, type ProviderOptions } from "../../types";

// ----- Libs
import axios from "axios";

// ----- Utils
import { handleProviderAxiosError } from "../../utils/handleProviderAxiosError";

export type DiscordTokenResponse = {
  access_token: string;
};

export type DiscordFindMyUserResponse = {
  user?: {
    id?: string;
    username?: string;
  };
};

// Export a Discord Provider to carry out OAuth and return a record object
export class DiscordProvider implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "Discord";

  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  // verify that the proof object contains valid === "true"
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    const errors = [];
    let valid = false,
      verifiedPayload: DiscordFindMyUserResponse = {},
      record = undefined;

    try {
      verifiedPayload = await verifyDiscord(payload.proofs.code);
      if (verifiedPayload.user?.id) {
        valid = verifiedPayload && verifiedPayload.user?.id ? true : false;
        record = {
          id: verifiedPayload.user?.id,
        };
      } else {
        errors.push(
          "Error: We were not able to verify a Discord account with your provided credentials. Please sign-up for a Discord account and try again."
        );
      }

      return {
        valid,
        record,
        errors,
      };
    } catch (e: unknown) {
      throw new ProviderExternalVerificationError(`Discord account check error: ${JSON.stringify(e)}`);
    }
  }
}

const requestAccessToken = async (code: string): Promise<string> => {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const redirectUri = process.env.DISCORD_CALLBACK;

  try {
    // Exchange the code for an access token
    const tokenRequest = await axios.post(
      "https://discord.com/api/oauth2/token",
      `grant_type=authorization_code&code=${code}&client_id=${clientId}&client_secret=${clientSecret}&redirect_uri=${redirectUri}`
    );

    if (tokenRequest.status != 200) {
      throw `Post for request returned status code ${tokenRequest.status} instead of the expected 200`;
    }

    const tokenResponse = tokenRequest.data as DiscordTokenResponse;

    return tokenResponse.access_token;
  } catch (e: unknown) {
    const error = e as { response: { data: { error_description: string } } };
    // eslint-disable-next-line no-console
    console.error("Error when verifying discord account for user:", error.response?.data);
    handleProviderAxiosError(error, "error requesting discord access token", [code]);
  }
};

const verifyDiscord = async (code: string): Promise<DiscordFindMyUserResponse> => {
  try {
    // retrieve user's auth bearer token to authenticate client
    const accessToken = await requestAccessToken(code);

    // Now that we have an access token fetch the user details
    const userRequest = await axios.get("https://discord.com/api/oauth2/@me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (userRequest.status != 200) {
      throw new ProviderExternalVerificationError(
        `Get user request returned status code ${userRequest.status} instead of the expected 200`
      );
    }

    return userRequest.data as DiscordFindMyUserResponse;
  } catch (error: unknown) {
    handleProviderAxiosError(error, "error verifying discord", [code]);
    return error;
  }
};
