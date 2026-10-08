/**
 * Demo: the Ethereum Stamp for a linked group (holonym-foundation/internal-docs#3587).
 *
 * Runs Karo's three worked examples
 * (https://github.com/holonym-foundation/internal-docs/issues/3587#issuecomment-6021887657)
 * through the real provider code — the group lookup, the per-chain aggregate,
 * "linking never lowers a score", and the ETHScore#50/75/90 tiers — and prints
 * what the WaaP address W is issued next to what the examples expect.
 *
 * Stub mode (default): the model service and the WaaP group lookup are
 * stubbed with the example's numbers. No network, no keys.
 *
 *   npx tsx scripts/eth-linked-group-demo.ts
 *
 * Live mode: real model calls for real addresses; only the group lookup is
 * stubbed (W and its linked wallets come from the command line).
 *
 *   DATA_SCIENCE_API_URL=<host[:port]> npx tsx scripts/eth-linked-group-demo.ts \
 *     --live <W> <A> [B] [C]
 *
 * Not part of the package build (tsconfig includes src/ and __tests__/ only).
 */
import axios from "axios";

type Chain = "eth" | "zk" | "polygon" | "arb" | "op" | "base";
const SUBPATH_CHAIN: Record<string, Chain> = {
  "eth-stamp-v2-predict": "eth",
  "zksync-model-v2-predict": "zk",
  "polygon-model-predict": "polygon",
  "arbitrum-model-predict": "arb",
  "optimism-model-predict": "op",
  "base-model-predict": "base",
};
const CHAINS = Object.values(SUBPATH_CHAIN);
const CHAIN_LABEL: Record<Chain, string> = {
  eth: "Ethereum",
  zk: "zkSync",
  polygon: "Polygon",
  arb: "Arbitrum",
  op: "Optimism",
  base: "Base",
};

type ChainData = Partial<Record<Chain, [score: number, txs: number]>>;
type Example = {
  title: string;
  wallets: Record<string, ChainData>; // A, B, C — W has no activity
  model: Record<string, number>; // counted chain results -> aggregate score
  expected: { score: number; tiers: string[] };
};

const W = "0x" + "1".repeat(40);
const A = "0x" + "a".repeat(40);
const B = "0x" + "b".repeat(40);
const C = "0x" + "c".repeat(40);
const NAMES: Record<string, string> = { [W]: "W (WaaP)", [A]: "A", [B]: "B", [C]: "C" };

const EXAMPLES: Example[] = [
  {
    title: "Example 1 — each wallet earns #50 alone, the group earns all three",
    wallets: { [A]: { base: [94, 150] }, [B]: { arb: [73, 200] }, [C]: { op: [52, 80] } },
    model: {
      "": -1,
      "base=94/150": 68,
      "arb=73/200": 52,
      "op=52/80": 73,
      "arb=73/200,base=94/150,op=52/80": 98,
    },
    expected: { score: 98, tiers: ["ETHScore#50", "ETHScore#75", "ETHScore#90"] },
  },
  {
    title: "Example 2 — no wallet earns a credential alone, the group earns #50",
    wallets: { [A]: { arb: [70, 150] }, [B]: { base: [69, 200] }, [C]: { eth: [52, 80] } },
    model: {
      "": -1,
      "arb=70/150": 42,
      "base=69/200": 29,
      "eth=52/80": 49,
      "arb=70/150,base=69/200,eth=52/80": 58,
    },
    expected: { score: 58, tiers: ["ETHScore#50"] },
  },
  {
    title: "Example 3 — the combined result is lower, so keep the best wallet",
    wallets: { [A]: { eth: [60, 150] }, [B]: { base: [10, 60] }, [C]: { arb: [10, 60] } },
    model: {
      "": -1,
      "eth=60/150": 94,
      "base=10/60": 0,
      "arb=10/60": 0,
      "arb=10/60,base=10/60,eth=60/150": 56,
    },
    expected: { score: 94, tiers: ["ETHScore#50", "ETHScore#75", "ETHScore#90"] },
  },
];

// The chain results the aggregate model counts (score >= 0, more than 10
// transactions), as a stable key: "arb=73/200,base=94/150".
const countedKey = (data: Record<string, number>): string =>
  CHAINS.filter((c) => data[`txs_${c}`] > 10 && data[`score_${c}`] >= 0)
    .map((c) => `${c}=${data[`score_${c}`]}/${data[`txs_${c}`]}`)
    .sort()
    .join(",");

const describeKey = (key: string): string =>
  key === ""
    ? "no counted chains"
    : key
        .split(",")
        .map((part) => {
          const [chain, rest] = part.split("=");
          return `${CHAIN_LABEL[chain as Chain]} ${rest.replace("/", " / ")}`;
        })
        .join(", ");

type Call = { address: string; key: string; score: number };
let calls: Call[] = [];

// Stub transport: the model service from the example's table, the group
// lookup from the given members. Patches the axios instance the provider uses.
function stubTransport(example: Example | null, group: { waap: string; addresses: string[] }) {
  const realPost = axios.post.bind(axios);
  axios.get = (async () => ({
    data: { addresses: group.addresses, waapAddress: group.waap, cooldownSeconds: 30 * 24 * 60 * 60 },
  })) as typeof axios.get;
  axios.post = (async (url: string, payload: { address: string; data?: Record<string, number> }) => {
    const subpath = url.split("/").pop() ?? "";
    if (!example) {
      // Live: real model call, recorded for the summary.
      const response = await realPost(url, payload, { timeout: 30_000 });
      if (subpath === "aggregate-model-predict" && payload.data) {
        const score = (response.data as { data: { human_probability: number } }).data.human_probability;
        calls.push({ address: payload.address, key: countedKey(payload.data), score });
      }
      return response;
    }
    if (subpath === "aggregate-model-predict") {
      const key = countedKey(payload.data ?? {});
      if (!(key in example.model)) throw new Error(`no example score for: ${describeKey(key)}`);
      const score = example.model[key];
      calls.push({ address: payload.address, key, score });
      return { data: { data: { human_probability: score, n_transactions: 0 } } };
    }
    const [score, txs] = example.wallets[payload.address]?.[SUBPATH_CHAIN[subpath]] ?? [-1, 0];
    return { data: { data: { human_probability: score, n_transactions: txs } } };
  }) as typeof axios.post;
}

const days = (seconds?: number) => (seconds === undefined ? "90 days (default)" : `${seconds / 86400} days`);

async function runFor(waap: string, others: string[], example: Example | null) {
  calls = [];
  stubTransport(example, { waap, addresses: [waap, ...others] });
  // Imported after the environment is set: the provider reads its env at load.
  const { getAggregateAnalysis, ETHEnthusiastProvider, ETHAdvocateProvider, ETHMaxiProvider } = await import(
    "../src/ETH/Providers/accountAnalysis.js"
  );

  const context = {};
  const analysis = await getAggregateAnalysis(waap, context);
  const tiers: string[] = [];
  for (const provider of [new ETHEnthusiastProvider(), new ETHAdvocateProvider(), new ETHMaxiProvider()]) {
    const payload = await provider.verify({ address: waap } as never, context);
    if (payload.valid) tiers.push(provider.type);
  }

  console.log("  Aggregate model calls the provider made for W:");
  for (const call of calls) {
    console.log(`    ${describeKey(call.key).padEnd(55)} -> ${call.score}`);
  }
  console.log(`  W is scored:   ${analysis.humanProbability}`);
  console.log(`  W is issued:   ${tiers.length ? tiers.join(", ") : "nothing"}`);
  console.log(`  Credentials last: ${days(analysis.expiresInSeconds)}`);
  return { score: analysis.humanProbability, tiers };
}

async function main() {
  const args = process.argv.slice(2);
  process.env.SILK_AUTH_SERVER_URL = "https://group-lookup.stub";
  process.env.SILK_SERVICE_API_KEY = "stub";

  if (args[0] === "--live") {
    const [waap, ...others] = args.slice(1).map((a) => a.toLowerCase());
    if (!process.env.DATA_SCIENCE_API_URL || !waap || others.length === 0) {
      console.error("Live mode needs DATA_SCIENCE_API_URL and: --live <W> <A> [B] [C]");
      process.exit(2);
    }
    console.log(`Live: W ${waap}, linked ${others.join(", ")}\n`);
    await runFor(waap, others, null);
    return;
  }

  process.env.DATA_SCIENCE_API_URL = process.env.DATA_SCIENCE_API_URL ?? "model.stub";
  let failures = 0;
  for (const example of EXAMPLES) {
    console.log(`\n${example.title}`);
    console.log("  Chain results:");
    for (const [address, data] of Object.entries(example.wallets)) {
      const results = Object.entries(data)
        .map(([chain, [score, txs]]) => `${CHAIN_LABEL[chain as Chain]} ${score} / ${txs}`)
        .join(", ");
      console.log(`    ${NAMES[address].padEnd(9)} ${results}`);
    }
    const got = await runFor(W, [A, B, C], example);
    const pass = got.score === example.expected.score && got.tiers.join() === example.expected.tiers.join();
    if (!pass) failures++;
    console.log(
      `  Expected:      ${example.expected.score} -> ${example.expected.tiers.join(", ")}   ${pass ? "PASS" : "FAIL"}`
    );
  }
  console.log(failures ? `\n${failures} example(s) did not match.` : "\nAll examples match.");
  process.exit(failures ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
