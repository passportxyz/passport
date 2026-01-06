// ----- Types
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import { ProviderExternalVerificationError, type Provider, type ProviderOptions } from "../../types.js";

// ----- Libs
import axios from "axios";

// ----- Utils
import { handleProviderAxiosError } from "../../utils/handleProviderAxiosError.js";

export type DiscordTokenResponse = {
  access_token: string;
};

export type DiscordFindMyUserResponse = {
  user?: {
    id?: string;
    username?: string;
  };
};

export type DiscordGuild = {
  id: string;
  name: string;
};

export type DiscordConnection = {
  type: string;
  name: string;
  verified: boolean;
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
    const errors: string[] = [];

    try {
      // Step 1: Exchange code for access token
      const accessToken = await requestAccessToken(payload.proofs.code);

      // Step 2: Get user info
      const userInfo = await makeDiscordRequest<DiscordFindMyUserResponse>(
        "https://discord.com/api/oauth2/@me",
        accessToken
      );

      if (!userInfo.user?.id) {
        errors.push("We were not able to verify a Discord account with your provided credentials.");
        return { valid: false, errors };
      }

      const userId = userInfo.user.id;

      // Step 3: Validate account age (from snowflake ID)
      const snowflake = BigInt(userId);
      const timestamp = Number(snowflake >> 22n) + 1420070400000;
      const createdAt = new Date(timestamp);
      const accountAgeDays = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

      if (accountAgeDays < 365) {
        errors.push(`Discord account must be at least 365 days old (current: ${accountAgeDays} days)`);
      }

      // Step 4: Get server list and validate count
      const guilds = await makeDiscordRequest<DiscordGuild[]>("https://discord.com/api/users/@me/guilds", accessToken);

      if (guilds.length < 10) {
        errors.push(`Must be a member of at least 10 servers (current: ${guilds.length})`);
      }

      // Step 5: Get verified connections
      const connections = await makeDiscordRequest<DiscordConnection[]>(
        "https://discord.com/api/users/@me/connections",
        accessToken
      );
      const verifiedConnections = connections.filter((conn) => conn.verified);

      if (verifiedConnections.length < 2) {
        errors.push(`Must have at least 2 verified external connections (current: ${verifiedConnections.length})`);
      }

      // Step 6: Final validation
      const valid = errors.length === 0;

      return {
        valid,
        record: valid ? { id: userId } : undefined,
        errors,
      };
    } catch (e: unknown) {
      throw new ProviderExternalVerificationError(`Discord account check error: ${String(e)}`);
    }
  }
}

// Helper function to make Discord API requests with rate limit handling
async function makeDiscordRequest<T>(url: string, accessToken: string, retries = 3): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data;
    } catch (error) {
      lastError = error;

      if (axios.isAxiosError(error) && error.response?.status === 429) {
        // Rate limited - check Retry-After header
        const retryAfter = error.response.headers["retry-after"];
        const waitMs = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000;

        if (attempt < retries - 1) {
          // Wait and retry
          await new Promise((resolve) => setTimeout(resolve, waitMs));
          continue;
        }
      }

      // For non-429 errors, throw immediately without retrying
      if (!axios.isAxiosError(error) || error.response?.status !== 429) {
        handleProviderAxiosError(error, "Discord API request", [url]);
      }
    }
  }

  // If we exhausted all retries (only happens for 429s), throw the last error
  handleProviderAxiosError(lastError, "Discord API request after retries", [url]);
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
