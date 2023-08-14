import type { Provider, ProviderOptions } from "../../types";
import { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

// ----- Libs
import axios from "axios";

// ----- Credential verification
import { getAddress } from "../../utils/signer";
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

const SCORER_BACKEND = process.env.PASSPORT_SCORER_BACKEND;

const createUpdateDBScore = async (address: string, score: number) => {
  try {
    const response = await axios.post(
      `${SCORER_BACKEND}trusta_labs/trusta-labs-score`, { address, score },
      {
        headers: {
          Authorization: process.env.CGRANTS_API_TOKEN
        }
      },
    );
    const { data } = response;
    return data.data;
  } catch (error) {
    throw error;
  }
};

const getTrustaLabsRiskScore = async (userAddress: string): Promise<{ valid: boolean; errors: string[]; }> => {  
  try {
    const result: AxiosResponse = await axios.post(TRUSTA_LABS_API_ENDPOINT, {
      address: userAddress, 
      chainId: "1"
      }, 
      {
        headers: {
          Authorization: `Bearer ${process.env.TRUSTA_LABS_ACCESS_TOKEN}`,
          accept: 'application/json',
          'content-type': 'application/json',
        },
    });
  
    const sybilRiskScore = result.data.data.sybilRiskScore;
    await createUpdateDBScore(userAddress, sybilRiskScore);

    if (sybilRiskScore >= -1 && sybilRiskScore <= 60) {
      return {
        valid: true,
        errors: [],
      }
    } else if (sybilRiskScore === -2 || sybilRiskScore > 60) {
      return {
        valid: false,
        errors: ["User does not qualify for this stamp"],
      }
    }
  } catch (error) {
    throw new ProviderExternalVerificationError(
      `Error requesting data: ${error}.`
    );
  }
}

export class TrustaLabsProvider implements Provider {
  type = "TrustaLabs";

  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    // if a signer is provider we will use that address to verify against
    const address = (await getAddress(payload)).toLowerCase();
    const { valid, errors } = await getTrustaLabsRiskScore(address);

    return await Promise.resolve({
      valid,
      errors,
      record: valid 
        ? {
            address: address,
          }
        : undefined,
    });
  }
}
