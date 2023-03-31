/* eslint-disable */
// ----- Types
import type { ProviderContext, RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import type { Provider, ProviderOptions } from "../../types";
import type { GithubFindMyUserResponse, GithubRepoRequestResponse, GithubUserRepoResponseData } from "./types";
import { requestAccessToken } from "./github";

// ----- HTTP Client
import axios from "axios";

export type GithubTokenResponse = {
  access_token: string;
};

type StargazerData = [
  data: {
    id?: string | number;
  }
];

// Export a Github Provider to carry out OAuth and return a record object
export class StarredGithubRepoProvider implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "StarredGithubRepoProvider";

  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  // verify that the proof object contains valid === "true"
  async verify(payload: RequestPayload, context: ProviderContext): Promise<VerifiedPayload> {
    let valid = false,
      accessToken: string,
      verifiedUserPayload: GithubFindMyUserResponse = {},
      verifiedUserRepoPayload: boolean | GithubUserRepoResponseData = {};

    try {
      accessToken = await requestAccessToken(payload.proofs.code, context);
      verifiedUserPayload = await verifyGithub(accessToken);
      verifiedUserRepoPayload = await verifyUserGithubRepo(verifiedUserPayload, accessToken);

      valid = verifiedUserPayload && verifiedUserPayload.id && verifiedUserRepoPayload ? true : false;
    } catch (e) {
      return { valid: false };
    }

    return {
      valid: valid,
      record: valid
        ? {
            id: `${verifiedUserPayload.id}gte1Star`,
          }
        : undefined,
    };
  }
}

const verifyGithub = async (ghAccessToken: string): Promise<GithubFindMyUserResponse> => {
  let userRequest;
  try {
    // Now that we have an access token fetch the user details
    userRequest = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `token ${ghAccessToken}` },
    });

    if (userRequest.status != 200) {
      throw `Get user request returned status code ${userRequest.status} instead of the expected 200`;
    }
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
      throw `User GET request returned status code ${userRequest.status} instead of the expected 200`;
    } else if (error.request) {
      throw `A request was made, but no response was received: ${error.request}`;
    } else {
      throw `Error: ${error.message}`;
    }
  }
  return userRequest.data as GithubFindMyUserResponse;
};

const verifyUserGithubRepo = async (userData: GithubFindMyUserResponse, ghAccessToken: string): Promise<boolean> => {
  let repoRequest: GithubRepoRequestResponse;

  try {
    // Fetch user's repo data
    repoRequest = await axios.get(`https://api.github.com/users/${userData.login}/repos?per_page=100`, {
      headers: { Authorization: `token ${ghAccessToken}` },
    });
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

  // Returns an object containing first instance of a user's repo if it has been starred
  // by a user other than the repo owner, or the last checked repo with no stars
  const checkUserRepoStars = async (): Promise<boolean> => {
    for (let i = 0; i < repoRequest.data.length; i++) {
      const repo = repoRequest.data[i];
      // Check if the GitHub user is the same as the repo owner
      // and if the stargazer count is gt 1
      if (userData.id === repo.owner.id && repo.stargazers_count > 1) {
        return true;
        // Check if the GitHub user is the same as the repo owner and
        // if their stargazer count equals 1
      } else if (userData.id === repo.owner.id && repo.stargazers_count === 1) {
        // GET the solo stargazer's data
        const stargazer: StargazerData = (await axios.get(repo.stargazers_url)).data as StargazerData;

        for (let i = 0; i < stargazer.length; i++) {
          if (stargazer[i].id != repo.owner.id) {
            return true;
          }
        }
        return false;
      }
    }
  };
  return await checkUserRepoStars();
};
