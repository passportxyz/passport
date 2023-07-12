// ----- Types
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import type { Provider, ProviderOptions } from "../../../types";
import { getGithubUserData, GithubContext, GithubUserData } from "./github";

// Export a Github Provider to carry out OAuth, check if the user has 5 >= repos,
// and return a record object
export class FiveOrMoreGithubRepos implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "FiveOrMoreGithubRepos";

  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  // verify that the proof object contains valid === "true"
  async verify(payload: RequestPayload, context: GithubContext): Promise<VerifiedPayload> {
    let valid = false,
      verifiedPayload: GithubUserData = {},
      errors: string[] | undefined;

    try {
      verifiedPayload = await getGithubUserData(payload.proofs.code, context);
      if (verifiedPayload.id && !errors?.length) valid = verifiedPayload.public_repos >= 5;
    } catch (e) {
      valid = false;
    }

    return {
      valid: valid,
      record: valid
        ? {
            id: verifiedPayload.id.toString() + "gte5GithubRepos",
          }
        : undefined,
    };
  }
}
