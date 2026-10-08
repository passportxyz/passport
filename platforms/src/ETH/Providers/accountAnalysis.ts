// ----- Types
import { type Provider } from "../../types.js";
import type { RequestPayload, VerifiedPayload, ProviderContext, PROVIDER_ID } from "@gitcoin/passport-types";
import axios from "axios";
import { handleProviderModelAxiosError } from "../../utils/handleProviderModelAxiosError.js";
import { getLinkedGroup, type LinkedGroup } from "./linkedGroup.js";

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
  /**
   * Set when the score used another linked wallet's results: the credential
   * must not outlive that wallet's place in the group.
   */
  expiresInSeconds?: number;
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
  base: "base-model-predict",
} as const;

type ModelKeys = keyof typeof MODEL_SUBPATHS;

type AggregateData = {
  [K in ModelKeys as `score_${K}`]: number;
} & {
  [K in ModelKeys as `txs_${K}`]: number;
};

export type ChainResult = { score: number; txs: number };
export type ChainResults = Record<ModelKeys, ChainResult>;
export type MemberResults = { address: string; results: ChainResults };

async function getChainResults(address: string): Promise<ChainResults> {
  const entries = await Promise.all(
    Object.entries(MODEL_SUBPATHS).map(async ([modelAbbreviation, subpath]) => {
      const { data } = await fetchModelData<ModelResponse>(address, subpath);
      return [modelAbbreviation, { score: data.human_probability, txs: data.n_transactions }] as const;
    })
  );
  return Object.fromEntries(entries) as ChainResults;
}

function toAggregateData(results: ChainResults): AggregateData {
  return Object.assign(
    {},
    ...Object.entries(results).map(([chain, { score, txs }]) => ({
      [`score_${chain}`]: score,
      [`txs_${chain}`]: txs,
    }))
  ) as AggregateData;
}

async function aggregateScore(address: string, results: ChainResults): Promise<number> {
  const { data } = await fetchModelData<ModelResponse>(address, "aggregate-model-predict", toAggregateData(results));
  return data.human_probability;
}

// The aggregate model ignores a chain score backed by 10 transactions or
// fewer, and -1 means the chain model had no data.
const MAX_IGNORED_TXS = 10;
const counts = ({ score, txs }: ChainResult): boolean => score >= 0 && txs > MAX_IGNORED_TXS;

/**
 * The per-chain aggregate function: for each chain, the best result any member
 * has, with that result's transaction count. Only results the aggregate model
 * counts can win; ties go to the higher count, then the lower address, so the
 * same group always gives the same bundle. A chain no member counts on keeps
 * the holder's own result.
 */
export function bestPerChain(
  holder: MemberResults,
  members: MemberResults[]
): { results: ChainResults; usesOtherWallets: boolean } {
  let usesOtherWallets = false;
  const results = { ...holder.results };
  for (const chain of Object.keys(MODEL_SUBPATHS) as ModelKeys[]) {
    const best = members
      .filter((member) => counts(member.results[chain]))
      .sort(
        (a, b) =>
          b.results[chain].score - a.results[chain].score ||
          b.results[chain].txs - a.results[chain].txs ||
          a.address.localeCompare(b.address)
      )[0];
    if (!best) continue;
    results[chain] = best.results[chain];
    if (best.address !== holder.address) usesOtherWallets = true;
  }
  return { results, usesOtherWallets };
}

/** A credential holding results from more than one wallet lasts 30 days, not 90. */
export const GROUP_CREDENTIAL_MAX_SECONDS = 30 * 24 * 60 * 60;

/**
 * The score of a WaaP address with its linked wallets
 * (holonym-foundation/internal-docs#3587): the per-chain aggregate function's
 * bundle, run through the same aggregate model. Linking never lowers a score,
 * so it is also scored against each member alone and keeps the highest. A
 * member whose model calls fail is left out; the holder's own calls failing
 * still fails the verification, as for a wallet alone.
 */
async function getGroupAnalysis(holder: string, group: LinkedGroup): Promise<AggregateAnalysis> {
  const [ownResults, settledOthers] = await Promise.all([
    getChainResults(holder),
    Promise.allSettled(
      group.addresses
        .filter((address) => address !== holder)
        .map(async (address) => ({ address, results: await getChainResults(address) }))
    ),
  ]);
  const own: MemberResults = { address: holder, results: ownResults };
  const others = settledOthers
    .filter((settled): settled is PromiseFulfilledResult<MemberResults> => settled.status === "fulfilled")
    .map((settled) => settled.value);

  const bundle = bestPerChain(own, [own, ...others]);
  const candidates: Promise<{ score: number; usesOtherWallets: boolean }>[] = [
    ...(bundle.usesOtherWallets
      ? [aggregateScore(holder, bundle.results).then((score) => ({ score, usesOtherWallets: true }))]
      : []),
    ...others.map((member) =>
      aggregateScore(member.address, member.results).then((score) => ({ score, usesOtherWallets: true }))
    ),
  ];
  const ownScore = await aggregateScore(holder, own.results);
  const scored = (await Promise.allSettled(candidates))
    .filter(
      (settled): settled is PromiseFulfilledResult<{ score: number; usesOtherWallets: boolean }> =>
        settled.status === "fulfilled"
    )
    .map((settled) => settled.value);

  // On a tie the holder's own score wins: it needs no shorter lifetime.
  const best = scored.reduce((current, candidate) => (candidate.score > current.score ? candidate : current), {
    score: ownScore,
    usesOtherWallets: false,
  });
  if (!best.usesOtherWallets) return { humanProbability: best.score };
  return {
    humanProbability: best.score,
    expiresInSeconds: Math.min(GROUP_CREDENTIAL_MAX_SECONDS, group.cooldownSeconds ?? GROUP_CREDENTIAL_MAX_SECONDS),
  };
}

export async function getAggregateAnalysis(address: string, context: ETHAnalysisContext): Promise<AggregateAnalysis> {
  if (!context?.aggregateAnalysis) {
    const holder = address.toLowerCase();
    const group = await getLinkedGroup(holder);
    context.aggregateAnalysis = group
      ? await getGroupAnalysis(holder, group)
      : { humanProbability: await aggregateScore(address, await getChainResults(address)) };
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
    const response = await axios.post<T>(url, payload, { timeout: 10_000 });

    return response.data;
  } catch (e) {
    handleProviderModelAxiosError(e, "model data (" + url_subpath + ")", [dataScienceEndpoint]);
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
      ...(analysis.expiresInSeconds !== undefined && { expiresInSeconds: analysis.expiresInSeconds }),
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
