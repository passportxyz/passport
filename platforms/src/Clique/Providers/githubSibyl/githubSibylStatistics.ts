/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
// ----- Types
import type { ProviderContext, RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import { CliqueClient, Environment } from "@clique2046/clique-sdk";
import type { Provider, ProviderOptions } from "../../../types";
import { getErrorString, ProviderError } from "../../../utils/errors";
import { getAddress } from "../../../utils/signer";
import { requestAccessToken } from "./githubSibyl";
import { getPublicKey, rsaEncrypt } from "./sibylPublicKey";


export type GithubSibylStatistics = {
  errors?: string[] | undefined;
  statistics?: Record<string, any>;
};

export type GithubSibylProviderOptions = {
  threshold: number;
  receivingAttribute: string;
  recordAttribute: string;
};

// Export a Gitcoin Provider. This is intended to be a generic implementation that should be extended
export class GithubSibylStatisticsProvider implements Provider {
  // The type will be determined dynamically, from the options passed in to the constructor
  type = "";

  // The URL from where to pull the data from
  dataUrl = "";

  // Options can be set here and/or via the constructor
  _options: GithubSibylProviderOptions = {
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
    const accessToken = await requestAccessToken(payload.proofs.code, context);
    console.log("clique githubSibyl - accessToken", address, JSON.stringify(accessToken));

    try {
      const githubSibylStatistic = await getGithubSibylStatistics(
        this._options.recordAttribute,
        address,
        accessToken
      );

      if (githubSibylStatistic.statistics) {
          const proof = githubSibylStatistic.statistics[this._options.recordAttribute]["proof"];
          const rawStr = Buffer.from(proof, "base64").toString();
          const proofArr: number[] = rawStr.split(",").map(Number);
          const proofResult: boolean = proofArr[127] === 1 ? true : false;
          let lowerResult = 0;
          if (proofResult) {
            lowerResult = proofArr[62] * 256 + proofArr[63];
          }
          if (this._options.threshold <= lowerResult) {
            valid = true;
          }
      }
      console.log("clique githubSibyl - statistics - proof", address, this._options.recordAttribute, valid);
      return {
        valid: valid,
        error: githubSibylStatistic.errors,
        record: valid ? {
                [this._options.recordAttribute]: `${this._options.threshold}`,
                } : undefined,
      };
    } catch (e) {
      return { valid: false };
    }
  }
}

const getGithubSibylStatistics = async (
  recordAttribute: string,
  walletAddress: string,
  githubAccessToken: string
): Promise<GithubSibylStatistics> => {
  try {
    const apiKey = process.env.CLIQUE_CLIENT_ID;
    const apiSecret = process.env.CLIQUE_CLIENT_SECRET;
    const isProduction = Boolean(process.env.CLIQUE_CLIENT_PRODUCTION);

    if (!apiKey || !apiSecret) {
      return null;
    }
    const client = new CliqueClient({
        apiKey,
        apiSecret,
        env: isProduction ? Environment.Production : Environment.Test,
      });
    const rsaPubKey: string = await getPublicKey();

    const githubAccessTokenRsa = await rsaEncrypt(githubAccessToken, rsaPubKey);

    const requestData = {
      walletAddress,
      githubAccessToken: githubAccessTokenRsa,
      selectPipelines: [recordAttribute],
      rsaPubKey: "xxx",
    };
    console.log("clique githubSibyl - requestData", requestData);
    const resp : Record<string, any> = await client.attestor.getStatistics(requestData);

    return resp as GithubSibylStatistics;
  } catch (_error) {
    const error = _error as ProviderError;
    console.log("clique githubSibyl Statistics error", recordAttribute, getErrorString(error));
    return {
      errors: [
        "Error get githubSibyl statistics",
        `${error?.message}`,
        `Status ${error.response?.status}: ${error.response?.statusText}`,
        `Details: ${JSON.stringify(error?.response?.data)}`,
      ],
    };
  }
};
