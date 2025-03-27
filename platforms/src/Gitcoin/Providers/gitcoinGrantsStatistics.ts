// ----- Types
import type { ProviderContext, RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import { ProviderExternalVerificationError, type Provider, type ProviderOptions } from "../../types.js";
import { ProviderError } from "../../utils/errors.js";
import axios from "axios";

export type GitcoinGrantStatistics = {
  error?: string | undefined;
  record?: { [k: string]: number };
};

export type GitcoinGrantProviderOptions = {
  threshold: number;
  receivingAttribute: string;
  recordAttribute: string;
};

const CGRANTS_API_URL = process.env.SCORER_ENDPOINT + "/internal/cgrants";

// Export a Gitcoin Provider. This is intended to be a generic implementation that should be extended
export class GitcoinGrantStatisticsProvider implements Provider {
  // The type will be determined dynamically, from the options passed in to the constructor
  type = "";

  urlPath = "/contributor_statistics";

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
    let valid = false,
      record = undefined,
      gitcoinGrantsStatistic;
    const errors = [];
    try {
      const dataUrl = CGRANTS_API_URL + this.urlPath;
      const address = payload.address.toLowerCase();
      gitcoinGrantsStatistic = await getGitcoinStatistics(dataUrl, address, context);

      valid =
        !gitcoinGrantsStatistic.error &&
        (gitcoinGrantsStatistic.record
          ? gitcoinGrantsStatistic.record[this._options.receivingAttribute] >= this._options.threshold
          : false);

      if (valid === true) {
        record = {
          // The type was previously incorrectly defined as string on the http response,
          // and if we correctly called .toString() here instead of doing the forced cast,
          // we would break our ability to hash against all previous records.
          address,
          [this._options.recordAttribute]: `${this._options.threshold}`,
        };
      } else {
        errors.push(
          `You do not qualify for this stamp. Your Grantee stats are less than the required thresholds: ${
            gitcoinGrantsStatistic.record[this._options.receivingAttribute]
          } out of ${this._options.threshold}.`
        );
      }

      if (!valid && errors.length === 0) {
        errors.push(gitcoinGrantsStatistic.error);
      }
      return {
        valid,
        errors,
        record,
      };
    } catch (e: unknown) {
      throw new ProviderExternalVerificationError(`Gitcoin Grants Statistic verification error: ${String(e)}.`);
    }
  }
}

type GitcoinStatisticsContext = {
  gitcoinGrantStatistics?: { [k: string]: GitcoinGrantStatistics };
};

const getGitcoinStatistics = async (
  dataUrl: string,
  address: string,
  context: GitcoinStatisticsContext
): Promise<GitcoinGrantStatistics> => {
  if (!context.gitcoinGrantStatistics?.[dataUrl]) {
    try {
      if (!context.gitcoinGrantStatistics) context.gitcoinGrantStatistics = {};

      const grantStatisticsRequest = await axios.get(`${dataUrl}?address=${address}`, {
        headers: { Authorization: process.env.SCORER_API_KEY },
      });

      context.gitcoinGrantStatistics[dataUrl] = {
        record: grantStatisticsRequest.data,
      } as GitcoinGrantStatistics;
    } catch (_error) {
      const error = _error as ProviderError;
      context.gitcoinGrantStatistics[dataUrl] = {
        error: `Error getting user info: ${error?.message} - Status ${error.response?.status}: ${
          error.response?.statusText
        } - Details: ${JSON.stringify(error?.response?.data)}`,
      };
      throw new ProviderExternalVerificationError(
        `Error getting user info: ${error?.message} - Status ${error.response?.status}: ${
          error.response?.statusText
        } - Details: ${JSON.stringify(error?.response?.data)}`
      );
    }
  }
  return context.gitcoinGrantStatistics[dataUrl];
};
