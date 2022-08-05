// ----- Types
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import type { Provider, ProviderOptions } from "../types";
import type {
  GithubFindMyUserResponse,
  GithubRepoRequestResponse,
  VerifiedGithubForkedRepoData,
} from "./types/githubTypes";

// ----- HTTP Client
import axios from "axios";

// ----- Utils
import { checkUserRepoForks } from "./utils/providerHelpers";

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
      verifiedUserPayload: GithubFindMyUserResponse = {},
      verifiedUserRepoPayload: VerifiedGithubForkedRepoData = {};

    try {
      verifiedUserPayload = await verifyGithub(payload.proofs.code);
      verifiedUserRepoPayload = await verifyUserGithubRepo(verifiedUserPayload, payload.proofs.code);
    } catch (e) {
      return { valid: false };
    } finally {
      valid =
        verifiedUserRepoPayload &&
        verifiedUserPayload &&
        verifiedUserRepoPayload.owner_id &&
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

const verifyGithub = async (code: string): Promise<GithubFindMyUserResponse> => {
  // retrieve user's auth bearer token to authenticate client
  const accessToken = await requestAccessToken(code);

  // Now that we have an access token fetch the user details
  const userRequest = await axios.get("https://api.github.com/user", {
    headers: { Authorization: `token ${accessToken}` },
  });

  if (userRequest.status != 200) {
    throw `Get user request returned status code ${userRequest.status} instead of the expected 200`;
  }

  return userRequest.data as GithubFindMyUserResponse;
};

const verifyUserGithubRepo = async (
  userData: GithubFindMyUserResponse,
  code: string
): Promise<VerifiedGithubForkedRepoData> => {
  // retrieve user's auth bearer token to authenticate client
  const accessToken = await requestAccessToken(code);

  // Once access token is received, fetch user repo data
  const repoRequest: GithubRepoRequestResponse = await axios.get(
    `https://api.github.com/user/${userData.login}/repos`,
    {
      headers: { Authorization: `token ${accessToken}` },
    }
  );

  if (repoRequest.status != 200) {
    throw `Get repo request returned status code ${repoRequest.status} instead of the expected 200`;
  }

  const repoRequestData: GithubRepoRequestResponse["data"] = repoRequest.data;

  // Returns an object with user's repo data or a boolean that assuages
  // whether authenticated GH user has at least one fork of their repo
  const userRepoForksCheck: VerifiedGithubForkedRepoData = checkUserRepoForks(userData, repoRequestData);

  return userRepoForksCheck;
};
