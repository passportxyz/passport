// ----- Types
import { type Provider } from "../../types";
import type { RequestPayload, VerifiedPayload, ProviderContext, PROVIDER_ID } from "@gitcoin/passport-types";
import axios from "axios";
import { handleProviderAxiosError } from "../../utils/handleProviderAxiosError";

type HumanProbability = number;

export type ModelResponse = {
  data: {
    human_probability: HumanProbability;
  };
};

type ETHAnalysis = {
  humanProbability: HumanProbability;
};

export type ETHAnalysisContext = ProviderContext & {
  ethAnalysis?: ETHAnalysis;
};

const dataScienceEndpoint = process.env.DATA_SCIENCE_API_URL;

export async function getETHAnalysis(address: string, context: ETHAnalysisContext): Promise<ETHAnalysis> {
  if (!context?.ethAnalysis) {
    const response = await fetchModelData<ModelResponse>(address, "eth-stamp-predict");

    context.ethAnalysis = {
      humanProbability: response.data.human_probability,
    };
  }
  return context.ethAnalysis;
}

export async function fetchModelData<T>(address: string, url_subpath: string): Promise<T> {
  try {
    const response = await axios.post(`http://${dataScienceEndpoint}/${url_subpath}`, {
      address,
    });
    return response.data as T;
  } catch (e) {
    handleProviderAxiosError(e, "model data (" + url_subpath + ")", [dataScienceEndpoint]);
  }
}

export type EthOptions = {
  type: PROVIDER_ID;
  minimum: number;
};

export class AccountAnalysis implements Provider {
  type: PROVIDER_ID;
  minimum: number;

  // construct the provider instance with supplied options
  constructor(options: EthOptions) {
    this.type = options.type;
    this.minimum = options.minimum;
  }

  async verify(payload: RequestPayload, context: ETHAnalysisContext): Promise<VerifiedPayload> {
    const { address } = payload;
    const ethAnalysis = await getETHAnalysis(address, context);

    if (ethAnalysis.humanProbability < this.minimum) {
      return {
        valid: false,
        errors: [
          `You received a score of ${ethAnalysis.humanProbability} from our analysis. You must have a score of ${this.minimum} or higher to obtain this stamp.`,
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

export class ETHEnthusiastProvider extends AccountAnalysis {
  constructor() {
    super({
      type: "ETHEnthusiast",
      minimum: 1,
    });
  }
}

export class ETHAdvocateProvider extends AccountAnalysis {
  constructor() {
    super({
      type: "ETHAdvocate",
      minimum: 50,
    });
  }
}

export class ETHMaxiProvider extends AccountAnalysis {
  constructor() {
    super({
      type: "ETHMaxi",
      minimum: 75,
    });
  }
}
