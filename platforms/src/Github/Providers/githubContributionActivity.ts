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
    const thresholdDays = parseInt(this._options.threshold);

    const { contributionDays, userId, hadBadCommits } = await fetchAndCheckContributions(context, payload.proofs.code);

    const valid = contributionDays >= thresholdDays;

    const errors = valid
      ? undefined
      : [
          `You have contributed on ${contributionDays} days, the minimum for this stamp is ${thresholdDays} days.${
            hadBadCommits
              ? " Some commits were ignored because they ocurred before the Github repo or user creation."
              : ""
          }`,
        ];

    return {
      valid,
      errors,
      record: {
        id: userId,
      },
    };
  }
}
