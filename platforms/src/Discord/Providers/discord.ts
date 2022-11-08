// ----- Types
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import type { Provider, ProviderOptions } from "../../types";
import axios from "axios";

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
    let valid = false,
      verifiedPayload: DiscordFindMyUserResponse = {};

    try {
      verifiedPayload = await verifyDiscord(payload.proofs.code);
    } catch (e) {
      return { valid: false };
    } finally {
      valid = verifiedPayload && verifiedPayload.user?.id ? true : false;
    }

    return {
      valid: valid,
      record: {
        id: verifiedPayload.user?.id,
      },
    };
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
    throw e;
  }
};

const verifyDiscord = async (code: string): Promise<DiscordFindMyUserResponse> => {
  // retrieve user's auth bearer token to authenticate client
  const accessToken = await requestAccessToken(code);

  // Now that we have an access token fetch the user details
  const userRequest = await axios.get("https://discord.com/api/oauth2/@me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (userRequest.status != 200) {
    throw `Get user request returned status code ${userRequest.status} instead of the expected 200`;
  }

  return userRequest.data as DiscordFindMyUserResponse;
};
