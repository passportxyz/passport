// ----- Types
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import type { Provider, ProviderOptions } from "../types";
import axios from "axios";
import { verifyGithub } from "./github";

const AMI_API_TOKEN = process.env.AMI_API_TOKEN;

export type GitcoinGrantStatistics = {
  [k: string]: number;
};

export type GitcoinGrantProviderOptions = {
  threshold: number;
  receivingAttribute: string;
  recordAttribute: string;
};

// Export a Gitcoin Provider. This is intended to be a generic implementation that should be extended
export class GitcoinGrantStatisticsProvider implements Provider {
  // The type will be determined dynamically, from the options passed in to the constructor
  type = "";

  // The URL from where to pull the data from
  dataUrl = "";

  // Options can be set here and/or via the constructor
  _options: GitcoinGrantProviderOptions = {
    threshold: 1,
    receivingAttribute: "",
    recordAttribute: "",
  };

  // construct the provider instance with supplied options
  constructor(providerTypePrefix: string, options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
    this.type = `${providerTypePrefix}#${this._options.recordAttribute}#${this._options.threshold}`;
  }

  // verify that the proof object contains valid === "true"
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    let valid = false;
    let githubUser;
    try {
      githubUser = await verifyGithub(payload.proofs.code);

      // Only check the contribution condition if a valid github id has been received
      valid = !!githubUser.id;
      if (valid) {
        const contributionStatistic = await getGitcoinStatistics(this.dataUrl, githubUser.login);
        valid = contributionStatistic[this._options.receivingAttribute] >= this._options.threshold;
      }
    } catch (e) {
      return { valid: false };
    }

    const ret = {
      valid: valid,
      record: valid
        ? {
            id: githubUser.id,
            [this._options.recordAttribute]: `${this._options.threshold}`,
          }
        : undefined,
    };

    return ret;
  }
}

const getGitcoinStatistics = async (dataUrl: string, handle: string): Promise<GitcoinGrantStatistics> => {
  const contributionStatisticsRequest = await axios.get(`${dataUrl}?handle=${handle}`, {
    headers: { Authorization: `token ${AMI_API_TOKEN}` },
  });

  if (contributionStatisticsRequest.status != 200) {
    throw `Get user request returned status code ${contributionStatisticsRequest.status} instead of the expected 200`;
  }

  return contributionStatisticsRequest.data as GitcoinGrantStatistics;
};
