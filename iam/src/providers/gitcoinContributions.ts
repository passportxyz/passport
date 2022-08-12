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

// Export a Github Provider to carry out OAuth and return a record object
export class GitcoinContributionProvider implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "GitcoinContributionProvider";

  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  // verify that the proof object contains valid === "true"
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    let valid = false;
    let githubUser;
    try {
      githubUser = await verifyGithub(payload.proofs.code);
      const contributionStatistic = await verifyGitcoinContributions(githubUser.login);
      valid = contributionStatistic.num_grants_contribute_to >= 1;
    } catch (e) {}

    return {
      valid: valid,
      record: valid
        ? {
            id: githubUser.id,
            numGrantsContributeToGte: "1",
          }
        : undefined,
    };
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
