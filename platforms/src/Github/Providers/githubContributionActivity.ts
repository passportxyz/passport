import type { Provider } from "../../types";
import { RequestPayload, ProviderContext, VerifiedPayload } from "@gitcoin/passport-types";
import { fetchAndCheckContributions } from "./githubClient";

export type GithubContributionActivityOptions = {
  threshold: string;
};

export class GithubContributionActivityProvider implements Provider {
  // The type will be determined dynamically, from the options passed in to the constructor
  type = "";

  _options = {
    threshold: "1",
  };

  constructor(options: GithubContributionActivityOptions) {
    this._options = { ...this._options, ...options };
    this.type = `githubContributionActivityGte#${this._options.threshold}`;
  }

  async verify(payload: RequestPayload, context: ProviderContext): Promise<VerifiedPayload> {
    const contributionResult = await fetchAndCheckContributions(context, payload.proofs.code, this._options.threshold);
    const valid = contributionResult.contributionValid;
    return {
      valid,
      error: contributionResult.errors,
      // double check record is sufficient, need to return address or userId?
      record: valid ? { id: `gte${this._options.threshold}GithubContributionActivity` } : undefined,
    };
  }
}
