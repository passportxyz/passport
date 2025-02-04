// ----- Types
import { type Provider } from "../../types.js";
import type { RequestPayload, VerifiedPayload, ProviderContext, PROVIDER_ID } from "@gitcoin/passport-types";
import axios from "axios";
import { handleProviderAxiosError } from "../../utils/handleProviderAxiosError.js";

export type ModelResponse = {
  data: {
    human_probability: number;
    n_transactions: number;
    gas_spent?: number;
    n_days_active?: number;
  };
};

type ETHAnalysis = {
  humanProbability: number;
  gasSpent: number;
  numberDaysActive: number;
  numberTransactions: number;
};

export type ETHAnalysisContext = ProviderContext & {
  ethAnalysis?: ETHAnalysis;
  aggregateAnalysis?: AggregateAnalysis;
};

export type AggregateAnalysis = {
  humanProbability: number;
};

const dataScienceEndpoint = process.env.DATA_SCIENCE_API_URL;

export async function getETHAnalysis(address: string, context: ETHAnalysisContext): Promise<ETHAnalysis> {
  if (!context?.ethAnalysis) {
    const { data } = await fetchModelData<ModelResponse>(address, "eth-stamp-v2-predict");

    context.ethAnalysis = {
      humanProbability: data.human_probability,
      gasSpent: data.gas_spent,
      numberDaysActive: data.n_days_active,
      numberTransactions: data.n_transactions,
    };
  }
  return context.ethAnalysis;
}

const MODEL_SUBPATHS = {
  eth: "eth-stamp-v2-predict",
  zk: "zksync-model-v2-predict",
  polygon: "polygon-model-predict",
  arb: "arbitrum-model-predict",
  op: "optimism-model-predict",
} as const;

type ModelKeys = keyof typeof MODEL_SUBPATHS;

type AggregateData = {
  [K in ModelKeys as `score_${K}`]: number;
} & {
  [K in ModelKeys as `txs_${K}`]: number;
};

export async function getAggregateAnalysis(address: string, context: ETHAnalysisContext): Promise<AggregateAnalysis> {
  if (!context?.aggregateAnalysis) {
    const results = await Promise.all(
      Object.entries(MODEL_SUBPATHS).map(async ([modelAbbreviation, subpath]) => {
        const { data } = await fetchModelData<ModelResponse>(address, subpath);
        return {
          [`score_${modelAbbreviation}`]: data.human_probability,
          [`txs_${modelAbbreviation}`]: data.n_transactions,
        };
      })
    );

    const aggregateData: AggregateData = Object.assign({}, ...results);

    const { data } = await fetchModelData<ModelResponse>(address, "aggregate-model-predict", aggregateData);

    context.aggregateAnalysis = {
      humanProbability: data.human_probability,
    };
  }
  return context.aggregateAnalysis;
}

export async function fetchModelData<T>(address: string, url_subpath: string, data?: AggregateData): Promise<T> {
  try {
    const payload: { address: string; data?: AggregateData } = { address };
    if (data) {
      payload["data"] = data;
    }
    const url = `http://${dataScienceEndpoint}/${url_subpath}`;
    const response = await axios.post<T>(url, payload);

    return response.data;
  } catch (e) {
    handleProviderAxiosError(e, "model data (" + url_subpath + ")", [dataScienceEndpoint]);
  }
}

export type EthOptions = {
  type: PROVIDER_ID;
  minimum: number;
  dataKey: keyof ETHAnalysis;
  failureMessageFormatter: (minimum: number, actual: number) => string;
};

export class AccountAnalysis implements Provider {
  type: PROVIDER_ID;
  minimum: number;
  dataKey: keyof ETHAnalysis;
  failureMessageFormatter: (minimum: number, actual: number) => string;

  // construct the provider instance with supplied options
  constructor(options: EthOptions) {
    this.type = options.type;
    this.minimum = options.minimum;
    this.dataKey = options.dataKey;
    this.failureMessageFormatter = options.failureMessageFormatter;
  }

  async verify(payload: RequestPayload, context: ETHAnalysisContext): Promise<VerifiedPayload> {
    const { address } = payload;
    const ethAnalysis = await getETHAnalysis(address, context);
    const value = ethAnalysis[this.dataKey];

    if (value < this.minimum) {
      return {
        valid: false,
        errors: [this.failureMessageFormatter(this.minimum, value)],
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

type HumanProbabilityOptions = {
  type: PROVIDER_ID;
  minimum: number;
};

class HumanProbabilityProvider implements Provider {
  type: PROVIDER_ID;
  minimum: number;

  constructor(options: HumanProbabilityOptions) {
    this.type = options.type;
    this.minimum = options.minimum;
  }

  async verify(payload: RequestPayload, context: ETHAnalysisContext): Promise<VerifiedPayload> {
    const { address } = payload;
    const analysis = await getAggregateAnalysis(address, context);
    const value = analysis.humanProbability;

    if (value < this.minimum) {
      return {
        valid: false,
        errors: [
          `You received a score of ${value} from our analysis. You must have a score of ${this.minimum} or higher to obtain this stamp.`,
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

export class ETHEnthusiastProvider extends HumanProbabilityProvider {
  constructor() {
    super({
      type: "ETHScore#50",
      minimum: 50,
    });
  }
}

export class ETHAdvocateProvider extends HumanProbabilityProvider {
  constructor() {
    super({
      type: "ETHScore#75",
      minimum: 75,
    });
  }
}

export class ETHMaxiProvider extends HumanProbabilityProvider {
  constructor() {
    super({
      type: "ETHScore#90",
      minimum: 90,
    });
  }
}

export class EthDaysActiveProvider extends AccountAnalysis {
  constructor() {
    super({
      type: "ETHDaysActive#50",
      minimum: 50,
      dataKey: "numberDaysActive",
      failureMessageFormatter: (minimum: number, actual: number) =>
        `You have been active on Ethereum on ${actual} distinct days. You must be active for ${minimum} days to obtain this stamp.`,
    });
  }
}

export class EthGasSpentProvider extends AccountAnalysis {
  constructor() {
    super({
      type: "ETHGasSpent#0.25",
      minimum: 0.25,
      dataKey: "gasSpent",
      failureMessageFormatter: (minimum: number, actual: number) =>
        `You have spent ${actual} ETH on Ethereum gas. You must spend ${minimum} ETH on gas to obtain this stamp.`,
    });
  }
}

export class EthTransactionsProvider extends AccountAnalysis {
  constructor() {
    super({
      type: "ETHnumTransactions#100",
      minimum: 100,
      dataKey: "numberTransactions",
      failureMessageFormatter: (minimum: number, actual: number) =>
        `You have made ${actual} transactions on Ethereum. You must make ${minimum} transactions to obtain this stamp.`,
    });
  }
}
