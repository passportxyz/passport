import type { Provider } from "../../types";
import { RequestPayload, ProviderContext, VerifiedPayload } from "@gitcoin/passport-types";
import { fetchGithubUserData, ContributionsCollection } from "../githubClient";

export type GithubContributionActivityOptions = {
  threshold: string;
};

export const checkContributionDays = (numberOfDays: number, contributionData: ContributionsCollection): boolean => {
  const { weeks } = contributionData.contributionCalendar;
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
    const githubContributions = await fetchGithubUserData(context, payload.proofs.code);
    const valid = checkContributionDays(parseInt(this._options.threshold), githubContributions.contributionData);

    return {
      valid,
      error: githubContributions.errors,
      // double check record is sufficient, need to return address or userId?
      record: valid ? { id: `gte${this._options.threshold}GithubContributionActivity` } : undefined,
    };
  }
}
