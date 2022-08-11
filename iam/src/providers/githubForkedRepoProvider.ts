// ----- Types
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import type { Provider, ProviderOptions } from "../types";
import type {
  GithubFindMyUserResponse,
  GithubUserRepoResponseData,
  GithubRepoRequestResponse,
} from "./types/githubTypes";

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
      verifiedUserRepoPayload: GithubUserRepoResponseData = {};

    try {
      accessToken = await requestAccessToken(payload.proofs.code);
      verifiedUserPayload = await verifyGithub(accessToken);
      verifiedUserRepoPayload = await verifyUserGithubRepo(verifiedUserPayload, accessToken);
    } catch (e) {
      return { valid: false };
    } finally {
      valid =
        verifiedUserPayload &&
        verifiedUserRepoPayload &&
        verifiedUserPayload.id &&
        verifiedUserRepoPayload.forks_count >= 1
          ? true
          : false;
    }

    return {
      valid: valid,
      record: {
        id: `${verifiedUserPayload.id}gte1Fork`,
      },
    };
  }
}

const requestAccessToken = async (code: string): Promise<string> => {
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
  if (tokenRequest.status != 200) {
    throw `Post for request returned status code ${tokenRequest.status} instead of the expected 200`;
  }
  const tokenResponse = tokenRequest.data as GithubTokenResponse;
  return tokenResponse.access_token;
};

const verifyGithub = async (ghAccessToken: string): Promise<GithubFindMyUserResponse> => {
  let userRequest;
  try {
    // Now that we have an access token fetch the user details
    userRequest = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `token ${ghAccessToken}` },
    });
    return userRequest.data as GithubFindMyUserResponse;
  } catch (e) {
    if (userRequest.status != 200) {
      throw `User GET request returned status code ${userRequest.status} instead of the expected 200`;
    }
  }
};

const verifyUserGithubRepo = async (
  userData: GithubFindMyUserResponse,
  ghAccessToken: string
): Promise<GithubUserRepoResponseData> => {
  let repoRequest: GithubRepoRequestResponse;

  try {
    // fetch user repo data
    repoRequest = await axios.get(`https://api.github.com/users/${userData.login}/repos`, {
      headers: { Authorization: `token ${ghAccessToken}` },
    });
  } catch (e) {
    if (repoRequest.status != 200) {
      throw `Repo GET request returned status code ${repoRequest.status} instead of the expected 200`;
    }
  }

  // Returns an object containing first instance of a user's repo if it has been forked,
  // or the last checked repo with no forks
  const userRepoForksCheck = repoRequest.data.find((repo: GithubUserRepoResponseData): GithubUserRepoResponseData => {
    // Check to see if the authenticated GH user is the same as the repo owner,
    // if the repo is not a fork of another repo, and if the repo fork count is gte 1
    if (userData.id === repo.owner.id && !repo.fork && repo.forks_count >= 1) {
      return repo;
    } else {
      return repo;
    }
  });

  return userRepoForksCheck;
};
