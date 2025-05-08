import { ethers } from "ethers";
import { createChainSweeper, processChainSweeper, ChainSweeperConfig, SweeperError } from "./ChainSweeper";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

const COMMAS_AND_SPACES = /[\s,]+/;

const getEnvVars = (): {
  thresholdWei: bigint;
  secretsArn: string;
  alchemyChainNames: string[];
  feeDestination: string;
} => {
  const requiredVars = ["SECRETS_ARN", "ALCHEMY_CHAIN_NAMES", "FEE_DESTINATION_ADDRESS"];
  const missingVars = requiredVars.filter((key) => !process.env[key]);
  if (missingVars.length) {
    throw new SweeperError(
      `Missing environment variable${missingVars.length > 1 ? "s" : ""}: ${missingVars.join(", ")}`
    );
  }
  const thresholdEth = process.env.BALANCE_THRESHOLD_ETH || "0.25";
  const secretsArn = process.env.SECRETS_ARN!;
  const feeDestination = process.env.FEE_DESTINATION_ADDRESS!;
  const alchemyChainNames = process.env.ALCHEMY_CHAIN_NAMES!.trim().split(COMMAS_AND_SPACES);
  const thresholdWei = ethers.parseEther(thresholdEth);
  return {
    thresholdWei,
    secretsArn,
    alchemyChainNames,
    feeDestination,
  };
};

const fetchSecrets = async (secretsArn: string): Promise<{ alchemyApiKey: string; privateKey: string }> => {
  const secretsClient = new SecretsManagerClient();
  const secretResponse = await secretsClient.send(new GetSecretValueCommand({ SecretId: secretsArn }));
  const secrets = JSON.parse(secretResponse.SecretString || "{}") as Record<string, string>;
  const requiredSecrets = ["ALCHEMY_API_KEY", "PRIVATE_KEY"];
  const missingSecrets = requiredSecrets.filter((key) => !secrets[key]);
  if (missingSecrets.length) {
    throw new SweeperError(`Missing secret${missingSecrets.length > 1 ? "s" : ""}: ${missingSecrets.join(", ")}`);
  }
  return {
    alchemyApiKey: secrets.ALCHEMY_API_KEY!,
    privateKey: secrets.PRIVATE_KEY!,
  };
};

const buildConfig = async (): Promise<{
  thresholdWei: bigint;
  secretsArn: string;
  alchemyChainNames: string[];
  feeDestination: string;
  alchemyApiKey: string;
  privateKey: string;
}> => {
  const envVars = getEnvVars();
  console.log(
    "=====Environment=====\n",
    JSON.stringify({ ...envVars, thresholdWei: envVars.thresholdWei.toString() }, null, 2),
    "\n===================="
  );
  const secrets = await fetchSecrets(envVars.secretsArn);
  return { ...envVars, ...secrets };
};

const processAllChains = async (
  config: Omit<ChainSweeperConfig, "alchemyChainName"> & { alchemyChainNames: string[] }
): Promise<void> => {
  for (const alchemyChainName of config.alchemyChainNames) {
    console.log(`Processing chain: ${alchemyChainName}`);
    const sweeper = await createChainSweeper({
      ...config,
      alchemyChainName,
    });
    await processChainSweeper(sweeper);
    console.log(`Finished processing chain: ${alchemyChainName}`);
  }
};

export const handler = async (): Promise<{ statusCode: number; body: string }> => {
  try {
    const config = await buildConfig();
    await processAllChains(config);
    return { statusCode: 200, body: "Processing complete" };
  } catch (error) {
    console.error("Lambda execution failed:", error instanceof SweeperError ? error.message : error);
    return { statusCode: 500, body: "Error processing chains" };
  }
};
