import { ethers } from "ethers";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { SweeperError } from "./ChainSweeper";

const COMMAS_AND_SPACES = /[\s,]+/;

export type SweeperConfig = {
  thresholdWei: bigint;
  alchemyChainNames: string[];
  feeDestination: string;
  alchemyApiKey: string;
  privateKey: string;
};

const getCommonEnvVars = () => {
  const requiredVars = ["ALCHEMY_CHAIN_NAMES", "FEE_DESTINATION_ADDRESS"];
  const missingVars = requiredVars.filter((key) => !process.env[key]);
  if (missingVars.length) {
    throw new SweeperError(
      `Missing environment variable${missingVars.length > 1 ? "s" : ""}: ${missingVars.join(", ")}`
    );
  }
  const thresholdEth = process.env.BALANCE_THRESHOLD_ETH || "0.25";
  const feeDestination = process.env.FEE_DESTINATION_ADDRESS!;
  const alchemyChainNames = process.env.ALCHEMY_CHAIN_NAMES!.trim().split(COMMAS_AND_SPACES);
  const thresholdWei = ethers.parseEther(thresholdEth);
  return { thresholdWei, alchemyChainNames, feeDestination };
};

export const loadConfigFromEnv = async (): Promise<SweeperConfig> => {
  const requiredVars = ["ALCHEMY_API_KEY", "PRIVATE_KEY"];
  const missingVars = requiredVars.filter((key) => !process.env[key]);
  if (missingVars.length) {
    throw new SweeperError(
      `Missing environment variable${missingVars.length > 1 ? "s" : ""}: ${missingVars.join(", ")}`
    );
  }
  const { thresholdWei, alchemyChainNames, feeDestination } = getCommonEnvVars();
  return {
    thresholdWei,
    alchemyChainNames,
    feeDestination,
    alchemyApiKey: process.env.ALCHEMY_API_KEY!,
    privateKey: process.env.PRIVATE_KEY!,
  };
};

export const loadConfigFromAWS = async (): Promise<SweeperConfig> => {
  const requiredVars = ["SECRETS_ARN"];
  const missingVars = requiredVars.filter((key) => !process.env[key]);
  if (missingVars.length) {
    throw new SweeperError(
      `Missing environment variable${missingVars.length > 1 ? "s" : ""}: ${missingVars.join(", ")}`
    );
  }
  const { thresholdWei, alchemyChainNames, feeDestination } = getCommonEnvVars();
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
    alchemyChainNames,
    feeDestination,
    alchemyApiKey: secrets.ALCHEMY_API_KEY!,
    privateKey: secrets.PRIVATE_KEY!,
  };
};
