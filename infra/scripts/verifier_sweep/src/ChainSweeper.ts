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

export const getClients = async ({
  privateKey,
  alchemyApiKey,
  alchemyChainName,
}: {
  privateKey: string;
  alchemyApiKey: string;
  alchemyChainName: string;
}) => {
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

export type ChainSweeperConfig = {
  alchemyApiKey: string;
  privateKey: string;
  thresholdWei: bigint;
  alchemyChainName: string;
  feeDestination: string;
};

export class ChainSweeper {
  private walletClient: WalletClient<Transport, Chain>;
  private publicClient: PublicClient<Transport, Chain>;
  private thresholdWei: bigint;
  private accountAddress: `0x${string}`;
  private feeDestination: `0x${string}`;

  constructor({
    walletClient,
    publicClient,
    thresholdWei,
    accountAddress,
    feeDestination,
  }: {
    walletClient: WalletClient<Transport, Chain>;
    publicClient: PublicClient<Transport, Chain>;
    thresholdWei: bigint;
    accountAddress: `0x${string}`;
    feeDestination: `0x${string}`;
  }) {
    this.walletClient = walletClient;
    this.publicClient = publicClient;
    this.thresholdWei = thresholdWei;
    this.accountAddress = accountAddress;
    this.feeDestination = feeDestination;
  }

  async process(): Promise<void> {
    console.log(`Checking wallet ${this.accountAddress}`);
    if (await this.shouldSweep()) {
      await this.sweep();
    } else {
      console.log(`Balance below threshold, no action needed`);
    }
  }

  private async shouldSweep(): Promise<boolean> {
    const balance = await this.publicClient.getBalance({ address: this.accountAddress });
    console.log(`Balance is ${formatEther(balance)} ETH`);
    const thresholdMet = balance >= this.thresholdWei;
    thresholdMet && console.log(`Threshold met, sending transaction`);
    return thresholdMet;
  }

  private async sweep(): Promise<void> {
    const balance = await this.publicClient.getBalance({ address: this.accountAddress });
    const value = balance;
    const txRequest = {
      account: this.walletClient.account!,
      to: this.feeDestination,
      value,
    };
    console.log(
      `Populated transaction: ${JSON.stringify(txRequest, (_, value) => (typeof value === "bigint" ? value.toString() : value))}`
    );
    const txHash = await this.walletClient.sendTransaction(txRequest);
    console.log(`Transaction sent: ${txHash}`);
  }

  static async create(config: ChainSweeperConfig): Promise<ChainSweeper> {
    const { thresholdWei, privateKey, feeDestination, alchemyApiKey, alchemyChainName } = config;
    const { publicClient, walletClient, account } = await getClients({
      privateKey,
      alchemyApiKey,
      alchemyChainName,
    });
    const accountAddress = account.address;
    return new ChainSweeper({
      publicClient,
      walletClient,
      thresholdWei,
      accountAddress,
      feeDestination: validateAddress(feeDestination),
    });
  }
}
