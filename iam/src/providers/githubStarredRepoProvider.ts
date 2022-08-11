// ----- Types
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import type { Provider, ProviderOptions } from "../types";
import type {
  GithubFindMyUserResponse,
  GithubRepoRequestResponse,
  GithubUserRepoResponseData,
} from "./types/githubTypes";

// ----- HTTP Client
import axios from "axios";

export type GithubTokenResponse = {
  access_token: string;
};

type StargazerData = {
  id?: string | number;
};

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
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    let valid = false,
      accessToken: string,
      verifiedUserPayload: GithubFindMyUserResponse = {},
      verifiedUserRepoPayload: boolean | GithubUserRepoResponseData = {};

    try {
      accessToken = await requestAccessToken(payload.proofs.code);
      verifiedUserPayload = await verifyGithub(accessToken);
      verifiedUserRepoPayload = await verifyUserGithubRepo(verifiedUserPayload, accessToken);
    } catch (e) {
      return { valid: false };
    } finally {
      valid = verifiedUserPayload && verifiedUserPayload.id && verifiedUserRepoPayload ? true : false;
    }

    return {
      valid: valid,
      record: {
        id: `${verifiedUserPayload.id}gte1Star`,
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
  // Now that we have an access token fetch the user details
  const userRequest = await axios.get("https://api.github.com/user", {
    headers: { Authorization: `token ${ghAccessToken}` },
  });

  if (userRequest.status != 200) {
    throw `Get user request returned status code ${userRequest.status} instead of the expected 200`;
  }

  return userRequest.data as GithubFindMyUserResponse;
};

const verifyUserGithubRepo = async (
  userData: GithubFindMyUserResponse,
  ghAccessToken: string
): Promise<GithubUserRepoResponseData | boolean> => {
  // Once access token is received, fetch user repo data
  const repoRequest: GithubRepoRequestResponse = await axios.get(
    `https://api.github.com/users/${userData.login}/repos?per_page=100`,
    {
      headers: { Authorization: `token ${ghAccessToken}` },
    }
  );

  if (repoRequest.status != 200) {
    throw `Get repo request returned status code ${repoRequest.status} instead of the expected 200`;
  }

  // Returns an object containing first instance of a user's repo if it has been starred
  // by a user other than the repo owner, or the last checked repo with no stars
  const checkUserRepoStars = async (): Promise<GithubUserRepoResponseData | boolean> => {
    for (let i = 0; i < repoRequest.data.length; i++) {
      const repo = repoRequest.data[i];
      // Check if the GitHub user is the same as the repo owner
      // and if the stargazer count is gt 1
      if (userData.id === repo.owner.id && repo.stargazers_count > 1) {
        return repo;
        // Check if the GitHub user is the same as the repo owner and
        // if their stargazer count equals 1
      } else if (userData.id === repo.owner.id && repo.stargazers_count === 1) {
        let stargazerData: StargazerData;
        // GET the solo stargazer's data
        const stargazerCheck = async (): Promise<[]> => {
          const stargazerResponse = await axios.get(repo.stargazers_url);
          const stargazerResponseData: [] = stargazerResponse.data;
          return stargazerResponseData;
        };

        const stargazer = await stargazerCheck();
        for (let i = 0; i < stargazer.length; i++) {
          stargazerData = stargazer[i];
        }

        return stargazerData.id === repo.owner.id ? false : repo;
      } else {
        return repo;
      }
    }
  };

  return await checkUserRepoStars();
};
