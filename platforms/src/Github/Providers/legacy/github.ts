// ----- Types
import type { ProviderContext, RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import type { Provider, ProviderOptions } from "../../../types";
import { ProviderError } from "../../../utils/errors";
import axios from "axios";

export type GithubTokenResponse = {
  access_token: string;
};

export type GithubUserData = {
  public_repos?: number;
  id?: number;
  login?: string;
  followers?: number;
  type?: string;
  errors?: string[];
};

export type GithubContext = ProviderContext & {
  github?: {
    userData?: GithubUserData;
    accessToken?: string;
    repos?: GithubUserRepoData[];
  };
};

export type GithubUserRepoData = {
  owner?: {
    id?: number;
    type?: string;
  };
  fork?: boolean;
  forks_count?: number;
  stargazers_url?: string;
  stargazers_count?: number;
};

export type GithubRepoRequestResponse = {
  data?: GithubUserRepoData[];
  status?: number;
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
    const verifiedPayload = await getGithubUserData(payload.proofs.code, context);

    const valid = !!(!verifiedPayload.errors && verifiedPayload.id);

    return {
      valid: valid,
      errors: verifiedPayload.errors,
      record: valid
        ? {
            // The type was previously incorrectly defined as string on the http response,
            // and if we correctly called .toString() here instead of doing the forced cast,
            // we would break our ability to hash against all previous records.
            id: verifiedPayload.id as unknown as string,
          }
        : undefined,
    };
  }
}

export const requestAccessToken = async (code: string, context: GithubContext): Promise<string> => {
  if (!context.github?.accessToken) {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    // Exchange the code for an access token
    const tokenRequest = await axios.post(
      `https://github.com/login/oauth/access_token?client_id=${clientId}&client_secret=${clientSecret}&code=${code}`,
      {},
      {
        headers: { Accept: "application/json" },
      }
    );

    const tokenResponse = tokenRequest.data as GithubTokenResponse;

    if (!context.github) context.github = {};
    context.github.accessToken = tokenResponse.access_token;
  }

  return context.github.accessToken;
};

export const getGithubUserData = async (code: string, context: GithubContext): Promise<GithubUserData> => {
  if (!context.github?.userData) {
    try {
      // retrieve user's auth bearer token to authenticate client
      const accessToken = await requestAccessToken(code, context);

      // Now that we have an access token fetch the user details
      const userRequest = await axios.get("https://api.github.com/user", {
        headers: { Authorization: `token ${accessToken}` },
      });

      if (!context.github) context.github = {};
      context.github.userData = userRequest.data;
    } catch (_error) {
      const error = _error as ProviderError;
      if (error?.response?.status === 429) {
        return {
          errors: ["Error getting getting github info", "Rate limit exceeded"],
        };
      }
      return {
        errors: ["Error getting getting github info", `${error?.message}`],
      };
    }
  }
  return context.github.userData;
};

export const getGithubUserRepos = async (code: string, context: GithubContext): Promise<GithubUserRepoData[]> => {
  if (!context.github?.repos) {
    const userData = await getGithubUserData(code, context);
    const accessToken = await requestAccessToken(code, context);
    let repoRequest: GithubRepoRequestResponse;

    try {
      await avoidGithubRateLimit();

      // fetch user's repo data
      repoRequest = await axios.get(`https://api.github.com/users/${userData.login}/repos?per_page=100`, {
        headers: { Authorization: `token ${accessToken}` },
      });
      // Returns true for first instance of a user's repo that has been forked,
      // false if no forks
      if (repoRequest.status != 200) {
        throw `Repo GET request returned status code ${repoRequest.status} instead of the expected 200`;
      }

      if (!context.github) context.github = {};
      context.github.repos = repoRequest.data;
    } catch (e) {
      const error = e as {
        response: {
          data: {
            error_description: string;
          };
        };
        request: string;
        message: string;
      };
      if (error.response) {
        throw `User GET request returned status code ${repoRequest.status} instead of the expected 200`;
      } else if (error.request) {
        throw `A request was made, but no response was received: ${error.request}`;
      } else {
        throw `Error: ${error.message}`;
      }
    }
  }
  return context.github.repos;
};

// For everything after the initial user load, we need to avoid the secondary rate
// limit by waiting 1 second between requests
export const avoidGithubRateLimit = async (): Promise<void> => {
  if (process.env.NODE_ENV === "test") return;

  await new Promise((resolve) => setTimeout(resolve, 1000));
};
