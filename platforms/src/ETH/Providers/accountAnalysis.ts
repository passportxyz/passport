// ----- Types
import { ProviderExternalVerificationError, type Provider } from "../../types";
import type { RequestPayload, VerifiedPayload, ProviderContext, PROVIDER_ID } from "@gitcoin/passport-types";
import axios from "axios";

type HumanProbability = {
  human_probability: number;
};

export type ModelResponse = {
  data: HumanProbability;
};

export type ETHAnalysisContext = ProviderContext & {
  ethAnalysis?: {
    humanProbability?: HumanProbability;
  };
};

const dataScienceEndpoint = process.env.DATA_SCIENCE_API_URL;

export async function getETHAnalysis(address: string, context: ETHAnalysisContext): Promise<HumanProbability> {
  if (context?.ethAnalysis?.humanProbability) {
    return context.ethAnalysis.humanProbability;
  }

  const response = (await axios.post(`${dataScienceEndpoint}`, {
    address,
  })) as unknown as { data: ModelResponse };

  const humanProbability = response.data.data;

  context.ethAnalysis = {
    humanProbability,
  };
  return humanProbability;
}

export type EthOptions = {
  type: PROVIDER_ID;
  threshold: number;
};

export class AccountAnalysis implements Provider {
  type: PROVIDER_ID;
  threshold: number;

  // construct the provider instance with supplied options
  constructor(options: EthOptions) {
    this.type = options.type;
    this.threshold = options.threshold;
  }

  async verify(payload: RequestPayload, context: ETHAnalysisContext): Promise<VerifiedPayload> {
    try {
      const { address } = payload;
      const ethAnalysis = await getETHAnalysis(address, context);

      if (ethAnalysis.human_probability < this.threshold) {
        return {
          valid: false,
          errors: [
            `You received a score of ${ethAnalysis.human_probability} from our analysis. You must have a score of ${this.threshold} or higher to obtain this stamp.`,
          ],
        };
      }

      return {
        valid: true,
        record: {
          address,
        },
      };
    } catch (e: unknown) {
      throw new ProviderExternalVerificationError(`Error validating ETH amounts: ${String(e)}`);
    }
  }
}

export class ETHAdvocateProvider extends AccountAnalysis {
  constructor() {
    super({
      type: "ETHAdvocate",
      threshold: 50,
    });
  }
}

export class ETHPioneerProvider extends AccountAnalysis {
  constructor() {
    super({
      type: "ETHPioneer",
      threshold: 75,
    });
  }
}

export class ETHMaxiProvider extends AccountAnalysis {
  constructor() {
    super({
      type: "ETHMaxi",
      threshold: 100,
    });
  }
}
