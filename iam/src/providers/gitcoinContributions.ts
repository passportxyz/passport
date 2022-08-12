// ----- Types
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import type { Provider, ProviderOptions } from "../types";
import axios from "axios";
import { verifyGithub } from "./github";

const AMI_API_TOKEN = process.env.AMI_API_TOKEN;

export type GitcoinContributionStatistics = {
  num_grants_contribute_to: number;
  num_rounds_contribute_to: number;
  total_contribution_amount: number;
  is_gr14_contributor: boolean;
};

export type GitcoinContributionOptions = {
  threshold: number;
};

// Export a Github Provider to carry out OAuth and return a record object
export class GitcoinContributionProvider implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "GitcoinContributionProvider";

  // Options can be set here and/or via the constructor
  _options: GitcoinContributionOptions = {
    threshold: 1,
  };

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
    this.type = `GitcoinContributionProviderGte${this._options.threshold}`;
  }

  // verify that the proof object contains valid === "true"
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    let valid = false;
    let githubUser;
    try {
      console.log("geri payload.proofs.code", payload.proofs.code);
      githubUser = await verifyGithub(payload.proofs.code);
      console.log("geri githubUser", githubUser);
      const contributionStatistic = await verifyGitcoinContributions(githubUser.login);
      console.log("geri contributionStatistic", contributionStatistic);
      console.log("geri this._options.threshold", this._options.threshold);
      valid = contributionStatistic.num_grants_contribute_to >= this._options.threshold;
    } catch (e) {
      console.log("geri error", e);
    }

    const ret = {
      valid: valid,
      record: valid
        ? {
            id: githubUser.id,
            numGrantsContributeToGte: `${this._options.threshold}`,
          }
        : undefined,
    };

    console.log("geri ret", ret);
    return ret;
  }
}

const verifyGitcoinContributions = async (handle: string): Promise<GitcoinContributionStatistics> => {
  const contributionStatisticsRequest = await axios.get(
    `https://gitcoin.co/grants/v1/api/vc/contributor_statistics?handle=${handle}`,
    {
      headers: { Authorization: `token ${AMI_API_TOKEN}` },
    }
  );

  if (contributionStatisticsRequest.status != 200) {
    throw `Get user request returned status code ${contributionStatisticsRequest.status} instead of the expected 200`;
  }

  return contributionStatisticsRequest.data as GitcoinContributionStatistics;
};
