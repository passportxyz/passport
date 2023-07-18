// ----- Types
import type { ProviderContext, RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import type { Provider, ProviderOptions } from "../../types";
import { ProviderError } from "../../utils/errors";
import axios from "axios";
import { getGithubUserData, GithubUserMetaData } from "../../Github/Providers/githubClient";

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

  urlPath = "";

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
    let valid = false;
    const githubUser: GithubUserMetaData = await getGithubUserData(payload.proofs.code, context);
    try {
      // Only check the contribution condition if a valid github id has been received
      valid = !githubUser.errors && !!githubUser.id;
      if (valid) {
        const dataUrl = process.env.CGRANTS_API_URL + this.urlPath;
        const gitcoinGrantsStatistic = await getGitcoinStatistics(dataUrl, githubUser.login, context);

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

type GitcoinStatisticsContext = {
  gitcoinGrantStatistics?: { [k: string]: GitcoinGrantStatistics };
};

const getGitcoinStatistics = async (
  dataUrl: string,
  handle: string,
  context: GitcoinStatisticsContext
): Promise<GitcoinGrantStatistics> => {
  if (!context.gitcoinGrantStatistics?.[dataUrl]) {
    try {
      // The gitcoin API expects lowercase handle
      const lowerHandle = handle.toLowerCase();
      const grantStatisticsRequest = await axios.get(`${dataUrl}?handle=${lowerHandle}`, {
        headers: { Authorization: process.env.CGRANTS_API_TOKEN },
      });

      if (!context.gitcoinGrantStatistics) context.gitcoinGrantStatistics = {};

      context.gitcoinGrantStatistics[dataUrl] = { record: grantStatisticsRequest.data } as GitcoinGrantStatistics;
    } catch (_error) {
      const error = _error as ProviderError;
      context.gitcoinGrantStatistics[dataUrl] = {
        errors: [
          "Error getting user info",
          `${error?.message}`,
          `Status ${error.response?.status}: ${error.response?.statusText}`,
          `Details: ${JSON.stringify(error?.response?.data)}`,
        ],
      };
    }
  }
  return context.gitcoinGrantStatistics[dataUrl];
};
