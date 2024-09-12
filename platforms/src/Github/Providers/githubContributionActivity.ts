import { ProviderExternalVerificationError, type Provider } from "../../types";
import { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import { fetchAndCheckContributions, GithubContext, requestAccessToken } from "../../utils/githubClient";

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
      const errors: string[] = [];
      let record = undefined,
        valid = false,
        contributionResult;

      try {
        // Call requestAccessToken to exchange the code for an access token and store it in the context
        await requestAccessToken(payload.proofs?.code, context);
        contributionResult = await fetchAndCheckContributions(context, this._options.threshold);
      } catch (e) {
        valid = false;
        errors.push(String(e));
      }

      valid = contributionResult.contributionValid;
      const githubId = context.github.id;

      if (valid) {
        record = { id: githubId };
      } else {
        errors.push("Your Github contributions did not qualify for this stamp.");
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
