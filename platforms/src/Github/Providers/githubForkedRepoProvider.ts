// ----- Types
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import type { Provider, ProviderOptions } from "../../types";
import { getGithubUserData, getGithubUserRepos, GithubContext, GithubUserData } from "./github";

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
  async verify(payload: RequestPayload, context: GithubContext): Promise<VerifiedPayload> {
    let valid = false,
      verifiedUserPayload: GithubUserData = {},
      errors: string[] | undefined;

    try {
      verifiedUserPayload = await getGithubUserData(payload.proofs.code, context);
      errors = verifiedUserPayload.errors;
      if (verifiedUserPayload.id && !errors?.length)
        valid = await userRepoForksCheck(verifiedUserPayload, payload.proofs.code, context);
    } catch (e) {
      valid = false;
    }

    return {
      valid: valid,
      error: errors,
      record: valid
        ? {
            id: `${verifiedUserPayload.id}gte1Fork`,
          }
        : undefined,
    };
  }
}

const userRepoForksCheck = async (
  userData: GithubUserData,
  accessToken: string,
  context: GithubContext
): Promise<boolean> => {
  const repos = await getGithubUserRepos(accessToken, context);
  // Check to see if the authenticated GH user is the same as the repo owner,
  // if the repo is not a fork of another repo, and if the repo fork count is gte 1
  return repos.some((repo) => userData.id === repo.owner.id && !repo.fork && repo.forks_count >= 1);
};
