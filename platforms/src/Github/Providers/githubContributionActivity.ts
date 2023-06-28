import type { Provider } from "../../types";
import { RequestPayload, ProviderContext, VerifiedPayload } from "@gitcoin/passport-types";
import { requestAccessToken, fetchGithubUserContributions, GithubContributionData } from "../githubClient";

export type GithubContributionActivityOptions = {
  threshold: string;
};

export const checkContributionDays = (numberOfDays: number, contributionData: GithubContributionData): boolean => {
  if (!contributionData.contributionData) {
    throw new Error("No contribution data available");
  }

  const { weeks } = contributionData.contributionData.contributionCalendar;
  const contributionDaysCount = weeks.reduce((total, week) => {
    const weekContributionDaysCount = week.contributionDays.filter((day) => day.contributionCount > 0).length;
    return total + weekContributionDaysCount;
  }, 0);

  return contributionDaysCount >= numberOfDays;
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
    await requestAccessToken(payload.proofs.code, context);
    const githubContributions = await fetchGithubUserContributions(context);

    const valid = checkContributionDays(parseInt(this._options.threshold), githubContributions);

    return {
      valid,
      error: githubContributions.errors,
      record: valid ? { id: `gte${this._options.threshold}GithubContributionActivity` } : undefined,
    };
  }
}
