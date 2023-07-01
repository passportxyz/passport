import type { Provider } from "../../types";
import { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import { fetchAndCheckContributions, GithubContext } from "./githubClient";

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

  async verify(payload: RequestPayload, context: GithubContext): Promise<VerifiedPayload> {
    const contributionResult = await fetchAndCheckContributions(context, payload.proofs.code, this._options.threshold);
    const valid = contributionResult.contributionValid;

    const githubId = context.github.id;

    return {
      valid,
      error: contributionResult.errors,
      record: valid ? { id: githubId } : undefined,
    };
  }
}
