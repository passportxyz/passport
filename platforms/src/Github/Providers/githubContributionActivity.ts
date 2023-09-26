import { ProviderExternalVerificationError, type Provider } from "../../types";
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
    try {
      let errors = [],
        record = undefined,
        valid = false;
      const contributionResult = await fetchAndCheckContributions(
        context,
        payload.proofs.code,
        this._options.threshold
      );
      valid = contributionResult.contributionValid;
      const githubId = context.github.id;

      if (valid) {
        record = { id: githubId };
      } else {
        errors.push("Error: Your Github contributions did not qualify for this stamp.");
      }

      if (contributionResult.errors) {
        errors = contributionResult.errors;
      }
      return {
        valid,
        errors,
        record,
      };
    } catch (error: unknown) {
      throw new ProviderExternalVerificationError(`Error verifying Github contributions: ${JSON.stringify(error)}`);
    }
  }
}
