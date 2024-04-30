// ----- Types
import { type Provider } from "../../types";
import type { RequestPayload, VerifiedPayload, ProviderContext, PROVIDER_ID } from "@gitcoin/passport-types";
import { fetchModelData } from "../../ETH/Providers/accountAnalysis";

export type ModelResponse = {
  data: {
    human_probability: number;
  };
};

type ZkSyncAnalysis = {
  humanProbability: number;
};

export type ZkSyncAnalysisContext = ProviderContext & {
  zkSyncAnalysis?: ZkSyncAnalysis;
};

export async function getZkSyncAnalysis(address: string, context: ZkSyncAnalysisContext): Promise<ZkSyncAnalysis> {

  if (!context?.zkSyncAnalysis) {
    const response = await fetchModelData<ModelResponse>(address, "zksync-model-v2-predict") 
    context.zkSyncAnalysis = {
      humanProbability: response.data.human_probability,
    };
  }
  return context.zkSyncAnalysis;
}

export type EthOptions = {
  type: PROVIDER_ID;
  minimum: number;
};

export class ZkSyncAccountAnalysis implements Provider {
  type: PROVIDER_ID;
  minimum: number;

  // construct the provider instance with supplied options
  constructor(options: EthOptions) {
    this.type = options.type;
    this.minimum = options.minimum;
  }

  async verify(payload: RequestPayload, context: ZkSyncAnalysisContext): Promise<VerifiedPayload> {
    const { address } = payload;
    const zkSyncAnalysis = await getZkSyncAnalysis(address, context);

    if (zkSyncAnalysis.humanProbability < this.minimum) {
      return {
        valid: false,
        errors: [
          `You received a score of ${zkSyncAnalysis.humanProbability} from our analysis. You must have a score of ${this.minimum} or higher to obtain this stamp.`,
        ],
      };
    }

    return {
      valid: true,
      record: {
        address,
      },
    };
  }
}

export class ZkSyncScore5Provider extends ZkSyncAccountAnalysis {
  constructor() {
    super({
      type: "zkSyncScore#5",
      minimum: 5,
    });
  }
}

export class ZkSyncScore20Provider extends ZkSyncAccountAnalysis {
  constructor() {
    super({
      type: "zkSyncScore#20",
      minimum: 20,
    });
  }
}

export class ZkSyncScore50Provider extends ZkSyncAccountAnalysis {
  constructor() {
    super({
      type: "zkSyncScore#50",
      minimum: 50,
    });
  }
}
