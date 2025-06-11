import {
  createPublicClient,
  http,
  formatEther,
  PublicClient,
  WalletClient,
  createWalletClient,
  Transport,
  Chain,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

export class SweeperError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SweeperError";
  }
}

const isValidAddress = (address: string): address is `0x${string}` => /^0x[0-9a-fA-F]{40}$/.test(address);

const validateAddress = (address: string): `0x${string}` => {
  if (!isValidAddress(address)) {
    throw new SweeperError(`Invalid address: ${address}`);
  }
  return address as `0x${string}`;
};

const getChainIdFromRpc = async (rpcUrl: string): Promise<number> => {
  try {
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method: "eth_chainId", params: [], id: 1 }),
    });
    if (!response.ok) throw new SweeperError(`Failed to fetch chainId from RPC: ${rpcUrl}`);
    const data = await response.json();
    if (!data.result) throw new SweeperError(`No chainId result from RPC: ${rpcUrl}`);
    return Number.parseInt(data.result, 16);
  } catch (err: any) {
    throw new SweeperError(`Error fetching chainId: ${err.message}`);
  }
};

export type ChainSweeperConfig = {
  alchemyApiKey: string;
  privateKey: string;
  thresholdWei: bigint;
  alchemyChainName: string;
  feeDestination?: string;
};

export type ChainSweeper = {
  walletClient: WalletClient<Transport, Chain>;
  publicClient: PublicClient<Transport, Chain>;
  thresholdWei: bigint;
  accountAddress: `0x${string}`;
  feeDestination: `0x${string}`;
};

export const getClients = async ({
  privateKey,
  alchemyApiKey,
  alchemyChainName,
}: {
  privateKey: string;
  alchemyApiKey: string;
  alchemyChainName: string;
}): Promise<{
  publicClient: PublicClient<Transport, Chain>;
  walletClient: WalletClient<Transport, Chain>;
  account: { address: `0x${string}` };
}> => {
  const rpcUrl = `https://${alchemyChainName}.g.alchemy.com/v2/${alchemyApiKey}`;
  const transport = http(rpcUrl);
  const account = privateKeyToAccount(privateKey as `0x${string}`);
  const chainId = await getChainIdFromRpc(rpcUrl);
  const chain: Chain = {
    id: chainId,
    name: alchemyChainName,
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: {
      default: { http: [rpcUrl] },
      public: { http: [rpcUrl] },
    },
    blockExplorers: {
      default: { name: "", url: "" },
    },
    contracts: {},
    testnet: false,
  };
  const publicClient = createPublicClient({
    transport,
    chain,
  });
  const walletClient = createWalletClient({
    account,
    transport,
    chain,
  });
  return { publicClient, walletClient, account };
};

export const createChainSweeper = async (config: ChainSweeperConfig): Promise<ChainSweeper> => {
  const { thresholdWei, privateKey, feeDestination, alchemyApiKey, alchemyChainName } = config;
  if (!feeDestination) {
    throw new SweeperError("feeDestination is required for ChainSweeper");
  }
  const { publicClient, walletClient, account } = await getClients({
    privateKey,
    alchemyApiKey,
    alchemyChainName,
  });
  return {
    publicClient,
    walletClient,
    thresholdWei,
    accountAddress: account.address,
    feeDestination: validateAddress(feeDestination),
  };
};

export const shouldSweep = async (sweeper: ChainSweeper): Promise<boolean> => {
  const balance = await sweeper.publicClient.getBalance({ address: sweeper.accountAddress });
  console.log(`Balance is ${formatEther(balance)} ETH`);
  const thresholdMet = balance >= sweeper.thresholdWei;
  if (thresholdMet) {
    console.log(`Threshold met`);
  }
  return thresholdMet;
};

// Hard coding to avoid any weirdness with gas estimates
const MIN_RETAINED_ETH = 0.001;
const MIN_RETAINED_WEI = BigInt(Math.floor(MIN_RETAINED_ETH * 1e18));

export const sweep = async (sweeper: ChainSweeper): Promise<void> => {
  const balance = await sweeper.publicClient.getBalance({ address: sweeper.accountAddress });
  const sweepable = balance > MIN_RETAINED_WEI ? balance - MIN_RETAINED_WEI : BigInt(0);
  if (sweepable <= 0n) {
    console.log(
      `Balance is at or below minimum retained amount (${formatEther(MIN_RETAINED_WEI)} ETH), nothing to sweep.`
    );
    return;
  }
  const txRequest = {
    account: sweeper.walletClient.account!,
    to: sweeper.feeDestination,
    value: sweepable,
  };
  console.log(
    `Populated transaction: ${JSON.stringify(txRequest, (_, value) => (typeof value === "bigint" ? value.toString() : value))}`
  );
  const txHash = await sweeper.walletClient.sendTransaction(txRequest);
  console.log(`Transaction sent: ${txHash}`);
};

export const processChainSweeper = async (sweeper: ChainSweeper): Promise<void> => {
  console.log(`Checking wallet ${sweeper.accountAddress}`);
  if (await shouldSweep(sweeper)) {
    await sweep(sweeper);
  } else {
    console.log(`Balance below threshold, no action needed`);
  }
};
