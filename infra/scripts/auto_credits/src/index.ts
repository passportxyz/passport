import { ethers } from "ethers";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

const CONTRACT_ADDRESS = "0x18494Fecf61d2282c45b8bf481403C1fcb5D94E6";
const CONTRACT_ABI = [
  "function creditsFor(address user) external view returns (uint256)",
  "function requestCredits() external",
];

export type AutoCreditsConfig = {
  privateKey: string;
  rpcUrl: string;
  threshold: bigint;
};

export class AutoCreditsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AutoCreditsError";
  }
}

const loadConfigFromEnv = async (): Promise<AutoCreditsConfig> => {
  const requiredVars = ["HUMAN_NETWORK_CLIENT_PRIVATE_KEY", "ETH_RPC_URL"];
  const missingVars = requiredVars.filter((key) => !process.env[key]);
  if (missingVars.length) {
    throw new AutoCreditsError(`Missing environment variable(s): ${missingVars.join(", ")}`);
  }

  const thresholdStr = process.env.CREDITS_THRESHOLD || "500000";

  return {
    privateKey: process.env.HUMAN_NETWORK_CLIENT_PRIVATE_KEY!,
    rpcUrl: process.env.ETH_RPC_URL!,
    threshold: BigInt(thresholdStr),
  };
};

const loadConfigFromAWS = async (): Promise<AutoCreditsConfig> => {
  const requiredEnvVars = ["PASSPORT_VC_SECRETS_ARN", "ETH_RPC_URL"];
  const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);
  if (missingEnvVars.length) {
    throw new AutoCreditsError(`Missing environment variable(s): ${missingEnvVars.join(", ")}`);
  }

  // Fetch VC secrets (HUMAN_NETWORK_CLIENT_PRIVATE_KEY)
  const secretsClient = new SecretsManagerClient();
  const vcSecretsArn = process.env.PASSPORT_VC_SECRETS_ARN!;
  const vcSecretResponse = await secretsClient.send(new GetSecretValueCommand({ SecretId: vcSecretsArn }));
  const vcSecrets = JSON.parse(vcSecretResponse.SecretString || "{}") as Record<string, string>;

  if (!vcSecrets.HUMAN_NETWORK_CLIENT_PRIVATE_KEY) {
    throw new AutoCreditsError("Missing HUMAN_NETWORK_CLIENT_PRIVATE_KEY in VC secrets");
  }

  const thresholdStr = process.env.CREDITS_THRESHOLD || "500000";

  return {
    privateKey: vcSecrets.HUMAN_NETWORK_CLIENT_PRIVATE_KEY,
    rpcUrl: process.env.ETH_RPC_URL!,
    threshold: BigInt(thresholdStr),
  };
};

export const checkAndRequestCredits = async (
  config: AutoCreditsConfig
): Promise<{
  creditsChecked: bigint;
  requestedCredits: boolean;
  txHash?: string;
}> => {
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const wallet = new ethers.Wallet(config.privateKey, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

  console.log("Checking credits for address:", wallet.address);

  const currentCredits = await contract.creditsFor(wallet.address);
  console.log("Current credits:", currentCredits.toString());
  console.log("Threshold:", config.threshold.toString());

  if (currentCredits < config.threshold) {
    console.log("Credits below threshold, requesting more...");

    const tx = await contract.requestCredits();
    console.log("Transaction hash:", tx.hash);

    const receipt = await tx.wait();
    console.log("Transaction confirmed in block:", receipt.blockNumber);
    console.log("Gas used:", receipt.gasUsed.toString());

    const newCredits = await contract.creditsFor(wallet.address);
    console.log("New credits balance:", newCredits.toString());

    return {
      creditsChecked: currentCredits,
      requestedCredits: true,
      txHash: tx.hash,
    };
  }

  console.log("Credits above threshold, no action needed");
  return {
    creditsChecked: currentCredits,
    requestedCredits: false,
  };
};

// IMPORTANT: Do NOT wrap this function in try-catch. Errors must bubble up
// so that Lambda fails and triggers the CloudWatch alarm for alerting.
export const runAutoCredits = async (useEnv: boolean = false): Promise<{ statusCode: number; body: string }> => {
  const config = await (useEnv ? loadConfigFromEnv() : loadConfigFromAWS());
  console.log("=====Configuration=====");
  console.log("RPC URL:", config.rpcUrl);
  console.log("Threshold:", config.threshold.toString());
  console.log("=======================");

  const result = await checkAndRequestCredits(config);

  const body = JSON.stringify({
    success: true,
    creditsChecked: result.creditsChecked.toString(),
    requestedCredits: result.requestedCredits,
    txHash: result.txHash,
  });

  console.log("Result:", body);
  return { statusCode: 200, body };
  // No try-catch: let errors bubble up so Lambda fails and CloudWatch alerts
};

// AWS Lambda handler
export const handler = async (event: any, context: any) => {
  return await runAutoCredits(false);
};
