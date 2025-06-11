import { ethers } from "ethers";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { SweeperError } from "./ChainSweeper";

export type SweeperConfig = {
  thresholdWei: bigint;
  chainDepositAddresses: Record<string, string>;
  alchemyApiKey: string;
  privateKey: string;
};

const validateEthereumAddress = (address: unknown): boolean => {
  return typeof address === "string" && ethers.isAddress(address);
};

const getCommonEnvVars = () => {
  const requiredVars = ["CHAIN_DEPOSIT_ADDRESSES"];
  const missingVars = requiredVars.filter((key) => !process.env[key]);
  if (missingVars.length) {
    throw new SweeperError(
      `Missing environment variable${missingVars.length > 1 ? "s" : ""}: ${missingVars.join(", ")}`
    );
  }
  const thresholdEth = process.env.BALANCE_THRESHOLD_ETH || "0.25";
  const chainDepositAddresses = JSON.parse(process.env.CHAIN_DEPOSIT_ADDRESSES!);

  // Validate all destination addresses
  for (const [chain, address] of Object.entries(chainDepositAddresses)) {
    if (!validateEthereumAddress(address)) {
      throw new SweeperError(`Invalid Ethereum address for chain ${chain}: ${address}`);
    }
  }

  const thresholdWei = ethers.parseEther(thresholdEth);
  return { thresholdWei, chainDepositAddresses };
};

export const loadConfigFromEnv = async (): Promise<SweeperConfig> => {
  const requiredVars = ["ALCHEMY_API_KEY", "PRIVATE_KEY"];
  const missingVars = requiredVars.filter((key) => !process.env[key]);
  if (missingVars.length) {
    throw new SweeperError(
      `Missing environment variable${missingVars.length > 1 ? "s" : ""}: ${missingVars.join(", ")}`
    );
  }
  const { thresholdWei, chainDepositAddresses } = getCommonEnvVars();
  return {
    thresholdWei,
    chainDepositAddresses,
    alchemyApiKey: process.env.ALCHEMY_API_KEY!,
    privateKey: process.env.PRIVATE_KEY!,
  };
};

export const loadConfigFromAWS = async (): Promise<SweeperConfig> => {
  const requiredEnvVars = ["CHAIN_DEPOSIT_ADDRESSES", "SECRETS_ARN"];
  const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);
  if (missingEnvVars.length) {
    throw new SweeperError(
      `Missing environment variable${missingEnvVars.length > 1 ? "s" : ""}: ${missingEnvVars.join(", ")}`
    );
  }
  const { thresholdWei, chainDepositAddresses } = getCommonEnvVars();
  const secretsArn = process.env.SECRETS_ARN!;
  const secretsClient = new SecretsManagerClient();
  const secretResponse = await secretsClient.send(new GetSecretValueCommand({ SecretId: secretsArn }));
  const secrets = JSON.parse(secretResponse.SecretString || "{}") as Record<string, string>;
  const requiredSecrets = ["ALCHEMY_API_KEY", "PRIVATE_KEY"];
  const missingSecrets = requiredSecrets.filter((key) => !secrets[key]);
  if (missingSecrets.length) {
    throw new SweeperError(`Missing secret${missingSecrets.length > 1 ? "s" : ""}: ${missingSecrets.join(", ")}`);
  }
  return {
    thresholdWei,
    chainDepositAddresses,
    alchemyApiKey: secrets.ALCHEMY_API_KEY!,
    privateKey: secrets.PRIVATE_KEY!,
  };
};
