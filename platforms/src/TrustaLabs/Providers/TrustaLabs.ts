import type { Provider, ProviderOptions } from "../../types";
import { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import { handleProviderAxiosError } from "../../utils/handleProviderAxiosError";

// ----- Libs
import axios from "axios";

// ----- Credential verification

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

const createUpdateDBScoreData = async (address: string, scoreData: TrustaLabsData) => {
  const accessToken = process.env.SCORER_API_KEY;
  try {
    await axios.post(
      `${process.env.PASSPORT_SCORER_BACKEND}trusta_labs/trusta-labs-score`,
      { address, scoreData },
      {
        headers: {
          Authorization: accessToken,
        },
      }
    );
  } catch (error) {
    handleProviderAxiosError(error, "report score", [accessToken]);
  }
};

const makeSybilScoreRequest = async (address: string): Promise<AxiosResponse> => {
  const accessToken = process.env.TRUSTA_LABS_ACCESS_TOKEN;
  try {
    return await axios.post(
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
  } catch (error) {
    handleProviderAxiosError(error, "sybil score", [accessToken]);
  }
};

const verifyTrustaLabsRiskScore = async (address: string): Promise<{ valid: boolean; errors: string[] }> => {
  const sybilRiskResponse = await makeSybilScoreRequest(address);
  const sybilScoreData = sybilRiskResponse.data.data;
  await createUpdateDBScoreData(address, sybilScoreData);

  const { sybilRiskScore } = sybilScoreData;

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
