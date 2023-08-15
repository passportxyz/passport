import type { Provider, ProviderOptions } from "../../types";
import { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

// ----- Libs
import axios from "axios";

// ----- Credential verification
import { ProviderExternalVerificationError } from "../../types";

interface SubScore {
  bulkOperationRisk: number;
  starlikeAssetsNetworkRisk: number;
  chainlikeAssetsNetworkRisk: number;
  similarBehaviorSequenceRisk: number;
  blacklistRisk: number;
}

interface TrustaLabsData {
  address: string;
  sybilRiskScore: number;
  sybilRiskLevel: string;
  subScore: SubScore;
}

interface TrustaLabsResponse {
  data: TrustaLabsData;
  success?: boolean;
  code?: number;
  message?: string;
}

interface AxiosResponse {
  data: TrustaLabsResponse;
}

const TRUSTA_LABS_API_ENDPOINT = "https://www.trustalabs.ai/service/openapi/queryRiskSummaryScore";

// Based on https://axios-http.com/docs/handling_errors
const handleAxiosError = (error: any, label: string, secretsToHide?: string[]) => {
  if (axios.isAxiosError(error)) {
    let message = `Error making ${label} request, `;
    if (error.response) {
      // Received a non 2xx response
      const { data, status, headers } = error.response;
      message += `received error response with code ${status}: ${JSON.stringify(data)}, headers: ${JSON.stringify(
        headers
      )}`;
    } else if (error.request) {
      // No response received
      message += "no response received";
    } else {
      // Something happened in setting up the request that triggered an Error
      message += error.message;
    }
    secretsToHide?.forEach((secret) => {
      message = message.replace(secret, "[SECRET]");
    });
    throw new ProviderExternalVerificationError(message);
  }
  throw error;
};

const createUpdateDBScore = async (address: string, score: number) => {
  const accessToken = process.env.CGRANTS_API_TOKEN;
  try {
    await axios.post(
      `${process.env.SCORER_ENDPOINT}/trusta_labs/trusta-labs-score`,
      { address, score },
      {
        headers: {
          Authorization: accessToken,
        },
      }
    );
  } catch (error) {
    handleAxiosError(error, "report score", [accessToken]);
  }
};

const makeSybilScoreRequest = async (address: string) => {
  const accessToken = process.env.TRUSTA_LABS_ACCESS_TOKEN;
  try {
    const result: AxiosResponse = await axios.post(
      TRUSTA_LABS_API_ENDPOINT,
      {
        address,
        chainId: "1",
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return result.data.data.sybilRiskScore;
  } catch (error) {
    handleAxiosError(error, "sybil score", [accessToken]);
  }
};

const verifyTrustaLabsRiskScore = async (address: string): Promise<{ valid: boolean; errors: string[] }> => {
  const sybilRiskScore = await makeSybilScoreRequest(address);
  await createUpdateDBScore(address, sybilRiskScore);

  const lowerBound = -1;
  const upperBound = 60;

  if (sybilRiskScore >= lowerBound && sybilRiskScore <= upperBound) {
    return {
      valid: true,
      errors: [],
    };
  } else {
    return {
      valid: false,
      errors: [`Sybil score ${sybilRiskScore} is outside of the allowed range (${lowerBound} to ${upperBound})`],
    };
  }
};

export class TrustaLabsProvider implements Provider {
  type = "TrustaLabs";

  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    const { address } = payload;

    // if a signer is provider we will use that address to verify against
    const { valid, errors } = await verifyTrustaLabsRiskScore(address);

    return {
      valid,
      errors,
      record: {
        address,
      },
    };
  }
}
