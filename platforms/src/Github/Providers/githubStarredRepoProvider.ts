// ----- Types
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import type { Provider, ProviderOptions } from "../../types";
import { avoidGithubRateLimit, getGithubUserData, getGithubUserRepos, GithubContext, GithubUserData } from "./github";

// ----- HTTP Client
import axios from "axios";

type StargazersResponse = {
  data: {
    id?: number;
  }[];
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
  async verify(payload: RequestPayload, context: GithubContext): Promise<VerifiedPayload> {
    let valid = false,
      verifiedUserPayload: GithubUserData = {},
      errors: string[] | undefined;

    try {
      verifiedUserPayload = await getGithubUserData(payload.proofs.code, context);
      errors = verifiedUserPayload.errors;
      if (verifiedUserPayload.id && !errors?.length)
        valid = await userRepoStargazersCheck(verifiedUserPayload, payload.proofs.code, context);
    } catch (e) {
      valid = false;
    }

    return {
      valid: valid,
      error: errors,
      record: valid
        ? {
            id: `${verifiedUserPayload.id}gte1Star`,
          }
        : undefined,
    };
  }
}

const userRepoStargazersCheck = async (
  userData: GithubUserData,
  accessToken: string,
  context: GithubContext
): Promise<boolean> => {
  const repos = await getGithubUserRepos(accessToken, context);
  const reposWithStargazers = repos.filter((repo) => userData.id === repo.owner.id && repo.stargazers_count > 0);

  // If any has 2 or more stargazers, return true
  if (reposWithStargazers.some((repo) => repo.stargazers_count > 1)) return true;

  // Otherwise each only has 1 stargazer, check that is not the owner
  for (const repo of reposWithStargazers) {
    await avoidGithubRateLimit();

    const stargazerResponse: StargazersResponse = await axios.get(repo.stargazers_url);

    if (stargazerResponse?.data?.[0]?.id !== repo.owner.id) {
      return true;
    }
  }

  return false;
};
