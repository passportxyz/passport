// ----- Types
import type { ProviderContext, RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import type { Provider, ProviderOptions } from "../../types";
import { getErrorString, ProviderError } from "../../utils/errors";
import { getAddress } from "../../utils/signer";
import axios from "axios";
import { getGithubUserData } from "../../Github/Providers/github";

const AMI_API_TOKEN = process.env.AMI_API_TOKEN;

export type GitcoinGrantStatistics = {
  errors?: string[] | undefined;
  record?: { [k: string]: number };
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
  async verify(payload: RequestPayload, context: ProviderContext): Promise<VerifiedPayload> {
    const address = (await getAddress(payload)).toLowerCase();
    let valid = false;
    const githubUser = await getGithubUserData(payload.proofs.code, context);
    try {
      // Only check the contribution condition if a valid github id has been received
      valid = !githubUser.errors && !!githubUser.id;
      if (valid) {
        const gitcoinGrantsStatistic = await getGitcoinStatistics(this.dataUrl, githubUser.login);
        console.log("gitcoin - getGitcoinStatistics", address, JSON.stringify(gitcoinGrantsStatistic));

        valid =
          !gitcoinGrantsStatistic.errors &&
          (gitcoinGrantsStatistic.record
            ? gitcoinGrantsStatistic.record[this._options.receivingAttribute] >= this._options.threshold
            : false);

        return {
          valid: valid,
          error: gitcoinGrantsStatistic.errors,
          record: valid
            ? {
                // The type was previously incorrectly defined as string on the http response,
                // and if we correctly called .toString() here instead of doing the forced cast,
                // we would break our ability to hash against all previous records.
                id: githubUser.id as unknown as string,
                [this._options.recordAttribute]: `${this._options.threshold}`,
              }
            : undefined,
        };
      }
    } catch (e) {
      return { valid: false };
    }

    const ret = {
      valid: valid,
      error: githubUser ? githubUser.errors : undefined,
      record: valid
        ? {
            id: `${githubUser.id}`,
            [this._options.recordAttribute]: `${this._options.threshold}`,
          }
        : undefined,
    };

    return ret;
  }
}

const getGitcoinStatistics = async (dataUrl: string, handle: string): Promise<GitcoinGrantStatistics> => {
  try {
    // The gitcoin API expects lowercase handle
    const lowerHandle = handle.toLowerCase();
    const grantStatisticsRequest = await axios.get(`${dataUrl}?handle=${lowerHandle}`, {
      headers: { Authorization: `token ${AMI_API_TOKEN}` },
    });

    console.log("gitcoin - API response", handle, dataUrl, JSON.stringify(grantStatisticsRequest.data));
    return { record: grantStatisticsRequest.data } as GitcoinGrantStatistics;
  } catch (_error) {
    const error = _error as ProviderError;
    console.log("gitcoinGrantsStatistics", dataUrl, handle, getErrorString(error));
    return {
      errors: [
        "Error getting user info",
        `${error?.message}`,
        `Status ${error.response?.status}: ${error.response?.statusText}`,
        `Details: ${JSON.stringify(error?.response?.data)}`,
      ],
    };
  }
};
