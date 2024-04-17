// ----- Types
import { type Provider } from "../../types";
import type { PROVIDER_ID, ProviderContext, RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

// ----- Libs
import axios from "axios";

// ----- Credential verification
import { getAddress } from "../../utils/signer";

// ----- Utils
import { handleProviderAxiosError } from "../../utils/handleProviderAxiosError";

// Alchemy Api key
// const apiKey = process.env.ALCHEMY_API_KEY;
const dataScienceEndpoint = process.env.DATA_SCIENCE_API_URL;

type NftApiResponse = {
  statusCode: number;
  statusDescription: string;
  isBase64Encoded: boolean;
  data: {
    human_probability: number;
    has_safe_nft: string;
  };
};

export type NftProviderOptions = {
  type: PROVIDER_ID;
  thresholdAmount: number;
};

class NftBaseProvider implements Provider {
  type: PROVIDER_ID;
  thresholdAmount: number;
  _options = {};

  constructor(options: NftProviderOptions) {
    this.type = options.type;
    this.thresholdAmount = options.thresholdAmount;
    this._options = { ...this._options, ...options };
  }
  verify(_payload: RequestPayload, _context: ProviderContext): Promise<VerifiedPayload> {
    throw new Error("Method not implemented, this base class should not be used directly");
  }
}

class NftCollectorBaseProvider extends NftBaseProvider {
  constructor(options: NftProviderOptions) {
    super(options);
    this.thresholdAmount = options.thresholdAmount;
  }

  // Verify that address defined in the payload owns at least one POAP older than 15 days
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    // if a signer is provider we will use that address to verify against
    const address = (await getAddress(payload)).toLowerCase();

    const response = await this.queryNftStampApi(address);
    const data = response.data;
    const human_probability = data.human_probability;

    if (human_probability >= this.thresholdAmount) {
      return {
        valid: true,
        record: { 
          human_probability: human_probability.toString(),
          address
         },
      };
    } else {
      return {
        valid: false,
        errors: [`Your internal NFTScore is  ${human_probability}. You need a minimum of ${this.thresholdAmount} to claim this stamp`],
      };
    }
  }

  async queryNftStampApi(address: string): Promise<NftApiResponse> {
    const providerUrl = `http://${dataScienceEndpoint}/nft-model-predict`;
    try {
      return (
        await axios.post(providerUrl, {
          address,
        })
      ).data as NftApiResponse;
    } catch (error) {
      handleProviderAxiosError(error, "queryNftStampApi", [address]);
    }
  }
}

export class DigitalCollectorProvider extends NftCollectorBaseProvider {
  constructor() {
    super({
      type: "DigitalCollector",
      thresholdAmount: 50,
    });
  }
}

export class ArtAficionadoProvider extends NftCollectorBaseProvider {
  constructor() {
    super({
      type: "ArtAficionado",
      thresholdAmount: 75,
    });
  }
}

export class NFTVisionaryProvider extends NftCollectorBaseProvider {
  constructor() {
    super({
      type: "NFTVisionary",
      thresholdAmount: 90,
    });
  }
}
