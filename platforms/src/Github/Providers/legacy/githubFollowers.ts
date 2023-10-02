// ----- Types
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import type { Provider, ProviderOptions } from "../../../types";
import { getGithubUserData, GithubContext, GithubUserData } from "./github";

type GithubFollowersProviderOptions = {
  minCount: number;
  minCountWord: string;
};

// Export a Github Provider to carry out OAuth, check if the user has 10 >= followers,
// and return an object verifying validity + a user record object
class GithubFollowersProvider implements Provider {
  // The type will be determined dynamically, from the options passed in to the constructor
  type: string;
  _options: GithubFollowersProviderOptions;
  minCount: number;

  // construct the provider instance with supplied options
  constructor(options: GithubFollowersProviderOptions) {
    this._options = options;
    this.minCount = options.minCount;
    this.type = `${this._options.minCountWord}OrMoreGithubFollowers`;
  }

  // verify that the proof object contains valid === "true"
  async verify(payload: RequestPayload, context: GithubContext): Promise<VerifiedPayload> {
    let valid = false,
      verifiedPayload: GithubUserData = {},
      errors: string[] | undefined;

    try {
      verifiedPayload = await getGithubUserData(payload.proofs.code, context);
      errors = verifiedPayload.errors;
      if (verifiedPayload.id && !errors?.length) valid = verifiedPayload.followers >= this.minCount;
    } catch (e) {
      valid = false;
    }

    return {
      valid: valid,
      errors: errors,
      record: valid
        ? {
            id: verifiedPayload.id.toString() + `gte${this.minCount}GithubFollowers`,
          }
        : undefined,
    };
  }
}

export class TenOrMoreGithubFollowers extends GithubFollowersProvider {
  constructor(options: ProviderOptions = {}) {
    super({
      ...options,
      minCount: 10,
      minCountWord: "Ten",
    });
  }
}

export class FiftyOrMoreGithubFollowers extends GithubFollowersProvider {
  constructor(options: ProviderOptions = {}) {
    super({
      ...options,
      minCount: 50,
      minCountWord: "Fifty",
    });
  }
}
