// ----- Types
import type { ProviderContext, RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import type { Provider, ProviderOptions } from "../../types";
import { getErrorString, ProviderError } from "../../utils/errors";
import { getAddress } from "../../utils/signer";
import axios from "axios";

export type GithubTokenResponse = {
  access_token: string;
};

export type GithubFindMyUserResponse = {
  errors?: string[] | undefined;
  id?: string;
  login?: string;
  type?: string;
};

// Export a Github Provider to carry out OAuth and return a record object
export class GithubProvider implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "Github";

  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  // verify that the proof object contains valid === "true"
  async verify(payload: RequestPayload, context: ProviderContext): Promise<VerifiedPayload> {
    const address = (await getAddress(payload)).toLowerCase();
    const verifiedPayload = await verifyGithub(payload.proofs.code, context);

    const valid = !!(!verifiedPayload.errors && verifiedPayload.id);

    return {
      valid: valid,
      error: verifiedPayload.errors,
      record: valid
        ? {
            id: verifiedPayload.id,
          }
        : undefined,
    };
  }
}

export const requestAccessToken = async (code: string, context: ProviderContext): Promise<string> => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const accessToken = context.githubAccessToken as string;

  if (accessToken) {
    return accessToken;
  }

  // Exchange the code for an access token
  const tokenRequest = await axios.post(
    `https://github.com/login/oauth/access_token?client_id=${clientId}&client_secret=${clientSecret}&code=${code}`,
    {},
    {
      headers: { Accept: "application/json" },
    }
  );

  const tokenResponse = tokenRequest.data as GithubTokenResponse;

  context["githubAccessToken"] = tokenResponse.access_token;
  return tokenResponse.access_token;
};

export const verifyGithub = async (code: string, context: ProviderContext): Promise<GithubFindMyUserResponse> => {
  try {
    // retrieve user's auth bearer token to authenticate client
    const accessToken = await requestAccessToken(code, context);

    // Now that we have an access token fetch the user details
    const userRequest = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `token ${accessToken}` },
    });
    console.log("verifyGithub result:", JSON.stringify(userRequest.data));

    return userRequest.data as GithubFindMyUserResponse;
  } catch (_error) {
    const error = _error as ProviderError;
    console.log("verifyGithub ERROR:", getErrorString(error));
    return {
      errors: [
        "Error getting getting github info",
        `${error?.message}`,
        `Status ${error.response?.status}: ${error.response?.statusText}`,
        `Details: ${JSON.stringify(error?.response?.data)}`,
      ],
    };
  }
};
