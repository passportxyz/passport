import { createPublicClient, http, formatEther, PublicClient, WalletClient, createWalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import onchainInfo from "../../../../deployments/onchainInfo.json";
import verifierAbis from "../../../../deployments/abi/GitcoinVerifier.json";

export class SweeperError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SweeperError";
  }
}

const isValidChainId = (hexChainId: string): hexChainId is keyof typeof onchainInfo =>
  Object.keys(onchainInfo).includes(hexChainId);

const isValidAddress = (address: string): address is `0x${string}` => /^0x\w*$/.test(address);

const validateAddress = (address: string): `0x${string}` => {
  if (!isValidAddress(address)) {
    throw new SweeperError(`Invalid address: ${address}`);
  }
  return address as `0x${string}`;
};

const getClients = ({
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

  const publicClient = createPublicClient({
    transport,
  });

  const account = privateKeyToAccount(validateAddress(privateKey));

  const walletClient = createWalletClient({
    account,
    transport,
  });

  return { publicClient, walletClient };
};

const getChainConfig = async (client: PublicClient) => {
  const chainId = await client.getChainId();

  // Convert chain ID to hex format (to match your config file format)
  const hexChainId = `0x${chainId?.toString(16)}`;

  if (!isValidChainId(hexChainId)) {
    throw new SweeperError(`Chain ID '${hexChainId}' (from '${chainId}') not found in onchainInfo`);
  }

  const chainInfo = onchainInfo[hexChainId];
  const abi = verifierAbis[hexChainId];

  return { chainInfo, abi };
};

export type ChainSweeperConfig = {
  alchemyApiKey: string;
  privateKey: string;
  thresholdWei: bigint;
  alchemyChainName: string;
};

export class ChainSweeper {
  private walletClient: WalletClient;
  private publicClient: PublicClient;
  private chainDescription: string;
  private thresholdWei: bigint;
  private contractAddress: `0x${string}`;
  private contractAbi: unknown[];

  constructor({
    walletClient,
    publicClient,
    chainDescription,
    thresholdWei,
    contractAddress,
    contractAbi,
  }: {
    walletClient: WalletClient;
    publicClient: PublicClient;
    chainDescription: string;
    thresholdWei: bigint;
    contractAddress: `0x${string}`;
    contractAbi: unknown[];
  }) {
    this.walletClient = walletClient;
    this.publicClient = publicClient;
    this.chainDescription = chainDescription;
    this.thresholdWei = thresholdWei;
    this.contractAddress = contractAddress;
    this.contractAbi = contractAbi;
  }

  async process(): Promise<void> {
    console.log(`${this.chainDescription}: Checking GitcoinVerifier contract at ${this.contractAddress}`);

    if (await this.shouldSweep()) {
      await this.sweep();
    } else {
      console.log(`${this.chainDescription}: Balance below threshold, no action needed`);
    }
  }

  private async shouldSweep(): Promise<boolean> {
    const balance = await this.publicClient.getBalance({ address: this.contractAddress });
    console.log(`${this.chainDescription}: Balance is ${formatEther(balance)} ETH`);
    const thresholdMet = balance >= this.thresholdWei;
    thresholdMet && console.log(`${this.chainDescription}: Threshold met, sending transaction`);
    return thresholdMet;
  }

  private async sweep(): Promise<void> {
    const { request } = await this.publicClient.simulateContract({
      account: this.walletClient.account,
      address: this.contractAddress,
      abi: this.contractAbi,
      functionName: "withdraw",
    });

    console.log(
      `${this.chainDescription}: Populated transaction: ${JSON.stringify(request, (_, value) => (typeof value === "bigint" ? value.toString() : value))}`
    );

    const txHash = await this.walletClient.writeContract(request);

    console.log(`${this.chainDescription}: Transaction sent: ${txHash}`);
  }

  static async create(config: ChainSweeperConfig): Promise<ChainSweeper> {
    const { thresholdWei, alchemyApiKey, alchemyChainName, privateKey } = config;

    const { publicClient, walletClient } = getClients({
      privateKey,
      alchemyApiKey,
      alchemyChainName,
    });

    const { chainInfo, abi } = await getChainConfig(publicClient);
    const contractAddress = validateAddress(chainInfo.GitcoinVerifier.address);
    const chainDescription = chainInfo.description;

    return new ChainSweeper({
      publicClient,
      walletClient,
      thresholdWei,
      chainDescription,
      contractAddress,
      contractAbi: abi,
    });
  }
}
