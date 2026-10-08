import { RequestPayload } from "@gitcoin/passport-types";
import axios from "axios";
import {
  ETHAdvocateProvider,
  ETHEnthusiastProvider,
  ETHMaxiProvider,
  GROUP_CREDENTIAL_MAX_SECONDS,
  bestPerChain,
  getAggregateAnalysis,
  type ChainResults,
} from "../Providers/accountAnalysis.js";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

type Chain = keyof ChainResults;
const SUBPATHS: Record<string, Chain> = {
  "eth-stamp-v2-predict": "eth",
  "zksync-model-v2-predict": "zk",
  "polygon-model-predict": "polygon",
  "arbitrum-model-predict": "arb",
  "optimism-model-predict": "op",
  "base-model-predict": "base",
};

const WAAP = "0x" + "1".repeat(40);
const B = "0x" + "b".repeat(40);
const C = "0x" + "c".repeat(40);

// [score, transactions] per address and chain; a chain left out has no data.
let chainData: Record<string, Partial<Record<Chain, [number, number]>>>;
let failing: Set<string>;
let aggregateCalls: { address: string; data: Record<string, number> }[];
// When set, the aggregate model answers from this table instead of averaging:
// the key is the chain results it counts, e.g. "arb=73/200,base=94/150". An
// input the table doesn't list throws, so an unexpected call fails the test.
let aggregateTable: Record<string, number> | undefined;

const countedKey = (data: Record<string, number>): string =>
  Object.values(SUBPATHS)
    .filter((chain) => data[`txs_${chain}`] > 10 && data[`score_${chain}`] >= 0)
    .map((chain) => `${chain}=${data[`score_${chain}`]}/${data[`txs_${chain}`]}`)
    .sort()
    .join(",");

const modelScore = (data: Record<string, number>): number => {
  if (!aggregateTable) return fakeAggregate(data);
  const key = countedKey(data);
  if (!(key in aggregateTable)) throw new Error(`unexpected aggregate input: ${key}`);
  return aggregateTable[key];
};

// Stand-in for the aggregate model: the average of the chain scores it counts
// (more than 10 transactions), so a weak chain pulls the score down, as the
// real model does (Problem 2 in internal-docs#3587).
const fakeAggregate = (data: Record<string, number>): number => {
  const counted = Object.values(SUBPATHS)
    .filter((chain) => data[`txs_${chain}`] > 10 && data[`score_${chain}`] >= 0)
    .map((chain) => data[`score_${chain}`]);
  return counted.length ? Math.round(counted.reduce((a, b) => a + b, 0) / counted.length) : -1;
};

const results = (values: Partial<Record<Chain, [number, number]>>): ChainResults =>
  Object.fromEntries(
    Object.values(SUBPATHS).map((chain) => {
      const [score, txs] = values[chain] ?? [-1, 0];
      return [chain, { score, txs }];
    })
  ) as ChainResults;

const lookup = (body: unknown) => mockedAxios.get.mockResolvedValue({ data: body });
const group = (cooldownSeconds?: number) =>
  lookup({ addresses: [WAAP, B, C], waapAddress: WAAP, ...(cooldownSeconds !== undefined && { cooldownSeconds }) });

const analyse = (address = WAAP) => getAggregateAnalysis(address, {});

describe("Ethereum Stamp for a linked group", () => {
  const saved = { url: process.env.SILK_AUTH_SERVER_URL, key: process.env.SILK_SERVICE_API_KEY };

  beforeEach(() => {
    jest.resetAllMocks();
    process.env.SILK_AUTH_SERVER_URL = "https://auth.waap.test";
    process.env.SILK_SERVICE_API_KEY = "svc-key";
    chainData = {};
    failing = new Set();
    aggregateCalls = [];
    aggregateTable = undefined;
    mockedAxios.post.mockImplementation(
      async (url: string, payload: { address: string; data?: Record<string, number> }) => {
        if (failing.has(payload.address)) throw new Error("model unavailable");
        const subpath = url.split("/").pop();
        if (subpath === "aggregate-model-predict") {
          aggregateCalls.push({ address: payload.address, data: payload.data });
          return { data: { data: { human_probability: modelScore(payload.data), n_transactions: 0 } } };
        }
        const [score, txs] = chainData[payload.address]?.[SUBPATHS[subpath]] ?? [-1, 0];
        return { data: { data: { human_probability: score, n_transactions: txs } } };
      }
    );
  });

  afterAll(() => {
    if (saved.url === undefined) delete process.env.SILK_AUTH_SERVER_URL;
    else process.env.SILK_AUTH_SERVER_URL = saved.url;
    if (saved.key === undefined) delete process.env.SILK_SERVICE_API_KEY;
    else process.env.SILK_SERVICE_API_KEY = saved.key;
  });

  it("keeps the best result per chain across the group", async () => {
    group();
    chainData = {
      [WAAP]: { eth: [40, 100] },
      [B]: { eth: [70, 30], base: [80, 50] },
      [C]: { base: [60, 500], op: [90, 20] },
    };

    const analysis = await analyse();

    const bundle = aggregateCalls.find((call) => call.address === WAAP && call.data.score_base === 80);
    expect(bundle?.data).toMatchObject({
      score_eth: 70,
      txs_eth: 30,
      score_base: 80,
      txs_base: 50,
      score_op: 90,
      txs_op: 20,
    });
    expect(analysis.humanProbability).toBe(80);
  });

  // Edge case 4: a new WaaP address with no history of its own.
  it("scores a WaaP address with no history from its linked wallets", async () => {
    group();
    chainData = { [B]: { eth: [60, 150] } };
    expect((await analyse()).humanProbability).toBe(60);
  });

  // Rule: linking never lowers a score (Problem 2).
  it("never scores the group below the WaaP address alone", async () => {
    group();
    chainData = {
      [WAAP]: { eth: [60, 150] },
      [B]: { base: [10, 60] },
      [C]: { arb: [10, 60] },
    };
    const analysis = await analyse();
    expect(analysis.humanProbability).toBe(60);
    // Its own score needs no shorter lifetime (edge case 6).
    expect(analysis.expiresInSeconds).toBeUndefined();
  });

  it("never scores the group below its best wallet alone", async () => {
    group();
    chainData = {
      [WAAP]: { base: [10, 60] },
      [B]: { eth: [60, 150] },
    };
    const analysis = await analyse();
    expect(analysis.humanProbability).toBe(60);
    expect(analysis.expiresInSeconds).toBe(GROUP_CREDENTIAL_MAX_SECONDS);
  });

  it("lasts 30 days when it uses another wallet's results", async () => {
    group();
    chainData = { [WAAP]: { eth: [40, 100] }, [B]: { eth: [90, 100] } };
    expect((await analyse()).expiresInSeconds).toBe(30 * 24 * 60 * 60);
  });

  it("never outlives the WaaP unlink cooldown", async () => {
    group(300);
    chainData = { [WAAP]: { eth: [40, 100] }, [B]: { eth: [90, 100] } };
    expect((await analyse()).expiresInSeconds).toBe(300);
  });

  // Rule: a linked wallet never holds a credential earned from another
  // wallet's activity (Problem 1).
  it("scores a linked wallet that isn't the WaaP address alone", async () => {
    lookup({ addresses: [WAAP, B], waapAddress: WAAP });
    chainData = { [WAAP]: { eth: [90, 500] }, [B]: { eth: [20, 100] } };

    const analysis = await analyse(B);

    expect(analysis).toEqual({ humanProbability: 20 });
    const called = new Set(mockedAxios.post.mock.calls.map(([, payload]) => (payload as { address: string }).address));
    expect([...called]).toEqual([B]);
  });

  it("scores the wallet alone when the lookup fails", async () => {
    mockedAxios.get.mockRejectedValue(new Error("timeout"));
    chainData = { [WAAP]: { eth: [30, 100] }, [B]: { eth: [90, 100] } };
    expect(await analyse()).toEqual({ humanProbability: 30 });
  });

  it("drops only the linked wallet whose models fail", async () => {
    group();
    failing = new Set([C]);
    chainData = { [WAAP]: { eth: [40, 100] }, [B]: { base: [80, 100] }, [C]: { op: [99, 100] } };
    expect((await analyse()).humanProbability).toBe(80);
  });

  it("still fails when the WaaP address's own models fail", async () => {
    group();
    failing = new Set([WAAP]);
    chainData = { [B]: { eth: [90, 100] } };
    await expect(analyse()).rejects.toThrow();
  });

  it("issues the tier with the shorter lifetime", async () => {
    group(600);
    chainData = { [WAAP]: { eth: [10, 100] }, [B]: { eth: [55, 100] } };
    const payload = await new ETHEnthusiastProvider().verify({ address: WAAP } as RequestPayload, {});
    expect(payload).toEqual({ valid: true, record: { address: WAAP }, expiresInSeconds: 600 });
  });

  it("issues a wallet's own tier without one", async () => {
    group();
    chainData = { [WAAP]: { eth: [55, 100] } };
    const payload = await new ETHEnthusiastProvider().verify({ address: WAAP } as RequestPayload, {});
    expect(payload).toEqual({ valid: true, record: { address: WAAP } });
  });

  // Karo's worked examples on internal-docs#3587 (2026-10-06). The WaaP
  // address W has no on-chain activity; A, B and C are linked wallets. Model
  // scores are the ones the examples give, keyed by the chain results counted.
  describe("internal-docs#3587 examples", () => {
    const A = "0x" + "a".repeat(40);
    const THIRTY_DAYS = 30 * 24 * 60 * 60;
    const linkedGroup = () => lookup({ addresses: [WAAP, A, B, C], waapAddress: WAAP });

    // The tiers W is issued, as the three ETHScore providers decide them.
    const tiersFor = async (address: string): Promise<string[]> => {
      const context = {};
      const providers = [new ETHEnthusiastProvider(), new ETHAdvocateProvider(), new ETHMaxiProvider()];
      const earned: string[] = [];
      for (const provider of providers) {
        const payload = await provider.verify({ address } as RequestPayload, context);
        if (payload.valid) earned.push(provider.type);
      }
      return earned;
    };

    it("Example 1: each wallet earns #50 alone, the group earns all three", async () => {
      linkedGroup();
      chainData = { [A]: { base: [94, 150] }, [B]: { arb: [73, 200] }, [C]: { op: [52, 80] } };
      aggregateTable = {
        "": -1, // W alone
        "base=94/150": 68,
        "arb=73/200": 52,
        "op=52/80": 73,
        "arb=73/200,base=94/150,op=52/80": 98,
      };

      const analysis = await analyse();

      expect(analysis).toEqual({ humanProbability: 98, expiresInSeconds: THIRTY_DAYS });
      // Each chain result keeps its own transaction count.
      const bundle = aggregateCalls.find((call) => call.address === WAAP && call.data.score_base === 94);
      expect(bundle?.data).toMatchObject({
        score_base: 94,
        txs_base: 150,
        score_arb: 73,
        txs_arb: 200,
        score_op: 52,
        txs_op: 80,
      });
      expect(await tiersFor(WAAP)).toEqual(["ETHScore#50", "ETHScore#75", "ETHScore#90"]);
    });

    it("Example 1: a linked wallet keeps only what it earns alone", async () => {
      linkedGroup();
      chainData = { [A]: { base: [94, 150] }, [B]: { arb: [73, 200] }, [C]: { op: [52, 80] } };
      aggregateTable = { "base=94/150": 68 };

      expect(await analyse(A)).toEqual({ humanProbability: 68 });
      expect(await tiersFor(A)).toEqual(["ETHScore#50"]);
    });

    it("Example 2: no wallet earns a credential alone, the group earns #50", async () => {
      linkedGroup();
      chainData = { [A]: { arb: [70, 150] }, [B]: { base: [69, 200] }, [C]: { eth: [52, 80] } };
      aggregateTable = {
        "": -1,
        "arb=70/150": 42,
        "base=69/200": 29,
        "eth=52/80": 49,
        "arb=70/150,base=69/200,eth=52/80": 58,
      };

      expect(await analyse()).toEqual({ humanProbability: 58, expiresInSeconds: THIRTY_DAYS });
      expect(await tiersFor(WAAP)).toEqual(["ETHScore#50"]);
    });

    it("Example 3: the combined result is lower, so the group keeps the best wallet", async () => {
      linkedGroup();
      chainData = { [A]: { eth: [60, 150] }, [B]: { base: [10, 60] }, [C]: { arb: [10, 60] } };
      aggregateTable = {
        "": -1,
        "eth=60/150": 94,
        "base=10/60": 0,
        "arb=10/60": 0,
        "arb=10/60,base=10/60,eth=60/150": 56,
      };

      // A's own result wins over the combined 56; it is another wallet's data,
      // so the credentials on W still last 30 days.
      expect(await analyse()).toEqual({ humanProbability: 94, expiresInSeconds: THIRTY_DAYS });
      expect(await tiersFor(WAAP)).toEqual(["ETHScore#50", "ETHScore#75", "ETHScore#90"]);
    });
  });
});

describe("bestPerChain", () => {
  const holder = (values: Partial<Record<Chain, [number, number]>>) => ({ address: WAAP, results: results(values) });
  const member = (address: string, values: Partial<Record<Chain, [number, number]>>) => ({
    address,
    results: results(values),
  });

  // Edge case 1: a "no data" result never wins.
  it("never picks a -1 result or one with 10 transactions or fewer", () => {
    const own = holder({ eth: [20, 100] });
    const { results: best, usesOtherWallets } = bestPerChain(own, [
      own,
      member(B, { eth: [95, 10] }),
      member(C, { eth: [-1, 900] }),
    ]);
    expect(best.eth).toEqual({ score: 20, txs: 100 });
    expect(usesOtherWallets).toBe(false);
  });

  // Edge case 2: the transaction count that goes with a tied score changes
  // the result, so the tie-break is fixed.
  it("breaks a tie on the higher transaction count, then the lower address", () => {
    const own = holder({});
    expect(bestPerChain(own, [own, member(C, { eth: [70, 40] }), member(B, { eth: [70, 90] })]).results.eth).toEqual({
      score: 70,
      txs: 90,
    });
    const tied = bestPerChain(own, [own, member(C, { eth: [70, 40] }), member(B, { eth: [70, 40] })]);
    expect(tied.results.eth).toEqual({ score: 70, txs: 40 });
    expect(bestPerChain(own, [own, member(C, { eth: [70, 40] })]).usesOtherWallets).toBe(true);
  });

  it("keeps the holder's own result on a chain no member counts on", () => {
    const own = holder({ zk: [-1, 3] });
    const { results: best } = bestPerChain(own, [own, member(B, { zk: [50, 5] })]);
    expect(best.zk).toEqual({ score: -1, txs: 3 });
  });
});
