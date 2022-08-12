// ----- Types
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import type { Provider, ProviderOptions } from "../types";
import type { GithubFindMyUserResponse, GithubRepoRequestResponse } from "./types/githubTypes";
import { requestAccessToken } from "./github";

// ----- HTTP Client
import axios from "axios";

export type GithubTokenResponse = {
  access_token: string;
};

// Export a Github Provider to carry out OAuth and return a record object
export class ForkedGithubRepoProvider implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "ForkedGithubRepoProvider";

  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  // verify that the proof object contains valid === "true"
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    let valid = false,
      accessToken: string,
      verifiedUserPayload: GithubFindMyUserResponse = {},
      verifiedUserRepoPayload: boolean;

    try {
      accessToken = await requestAccessToken(payload.proofs.code);
      verifiedUserPayload = await verifyGithub(accessToken);
      verifiedUserRepoPayload = await verifyUserGithubRepo(verifiedUserPayload, accessToken);
      valid = verifiedUserPayload && verifiedUserRepoPayload ? true : false;
    } catch (e) {
      return { valid: false };
    }

    return {
      valid: valid,
      record: valid
        ? {
            id: `${verifiedUserPayload.id}gte1Fork`,
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
  } catch (e) {
    if (userRequest.status != 200) {
      throw `User GET request returned status code ${userRequest.status} instead of the expected 200`;
    }
  }
  return userRequest.data as GithubFindMyUserResponse;
};

const verifyUserGithubRepo = async (userData: GithubFindMyUserResponse, ghAccessToken: string): Promise<boolean> => {
  let repoRequest: GithubRepoRequestResponse;

  try {
    // fetch user repo data
    repoRequest = await axios.get(`https://api.github.com/users/${userData.login}/repos`, {
      headers: { Authorization: `token ${ghAccessToken}` },
    });
    // Returns true for first instance of a user's repo that has been forked,
    // false if no forks
    if (repoRequest.status != 200) {
      throw `Repo GET request returned status code ${repoRequest.status} instead of the expected 200`;
    }
  } catch (e) {
    if (repoRequest.status != 200) {
      throw `Repo GET request returned status code ${repoRequest.status} instead of the expected 200`;
    }
    return false;
  }
  const userRepoForksCheck = (): boolean => {
    for (let i = 0; i < repoRequest.data.length; i++) {
      const repo = repoRequest.data[i];
      // Check to see if the authenticated GH user is the same as the repo owner,
      // if the repo is not a fork of another repo, and if the repo fork count is gte 1
      if (userData.id === repo.owner.id && !repo.fork && repo.forks_count >= 1) {
        return true;
      }
    }
  };
  return userRepoForksCheck();
};
