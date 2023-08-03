// ----- Types
import type { ProviderContext, RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import type { Provider, ProviderOptions } from "../../types";
import { ProviderError } from "../../utils/errors";
import axios from "axios";

// ----- Credential verification
import { getAddress } from "../../utils/signer";
export type AlloContributorStatistics = {
  errors?: string[] | undefined;
  record?: { [k: string]: number };
};

export type GitcoinGrantProviderOptions = {
  threshold: number;
  receivingAttribute: string;
  recordAttribute: string;
};

// Export a Gitcoin Provider. This is intended to be a generic implementation that should be extended
export class AlloStatisticsProvider implements Provider {
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
    const lowerCaseAddress = (await getAddress(payload)).toLowerCase();

    try {
      const dataUrl = process.env.CGRANTS_API_URL + this.urlPath;
      const alloContributorStatistic = await getAlloStatistics(dataUrl, lowerCaseAddress, context);

      valid =
        !alloContributorStatistic.errors &&
        (alloContributorStatistic.record
          ? alloContributorStatistic.record[this._options.receivingAttribute] >= this._options.threshold
          : false);

      return {
        valid: valid,
        error: alloContributorStatistic.errors,
        record: valid
          ? {
              address: lowerCaseAddress,
              [this._options.recordAttribute]: `${this._options.threshold}`,
            }
          : undefined,
      };
    } catch (e) {
      console.log("geri error", e);
      return { valid: false, error: [e.toString()] };
    }
  }
}

const getAlloStatistics = async (
  dataUrl: string,
  lowerCaseAddress: string,
  context: ProviderContext
): Promise<AlloContributorStatistics> => {
  if (!context[lowerCaseAddress]) {
    try {
      // The gitcoin API expects lowercase handle
      const alloStatistics = await axios.get(dataUrl, {
        headers: { Authorization: process.env.CGRANTS_API_TOKEN },
        params: { address: lowerCaseAddress },
      });

      if (!context.alloContributorStatistics) {
        context.alloContributorStatistics = {};
      }

      context[lowerCaseAddress] = {
        record: alloStatistics.data,
      } as AlloContributorStatistics;
    } catch (_error) {
      const error = _error as ProviderError;
      context[lowerCaseAddress] = {
        errors: [
          `Error getting info for address '${lowerCaseAddress}' on url '${dataUrl}'`,
          `${error?.message}`,
          `Status ${error.response?.status}: ${error.response?.statusText}`,
          `Details: ${JSON.stringify(error?.response?.data)}`,
        ],
      };
    }
  }
  return context[lowerCaseAddress];
};
