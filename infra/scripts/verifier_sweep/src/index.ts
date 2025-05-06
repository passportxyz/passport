import { ethers } from "ethers";
import { ChainSweeper, ChainSweeperConfig, SweeperError } from "./ChainSweeper";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

const COMMAS_AND_SPACES = /[\s,]+/;

const loadEnvVars = () => {
  const missingVars = ["SECRETS_ARN", "ALCHEMY_CHAIN_NAMES", "FEE_DESTINATION_ADDRESS"].filter(
    (key) => !process.env[key]
  );
  if (missingVars.length) {
    throw new SweeperError(
      `Missing environment variable${missingVars.length > 1 ? "s" : ""}: ${missingVars.join(", ")}`
    );
  }
  const thresholdEth = process.env.BALANCE_THRESHOLD_ETH || "0.25";
  const secretsArn = process.env.SECRETS_ARN!;
  const feeDestination = process.env.FEE_DESTINATION_ADDRESS!;
  const alchemyChainNames = process.env.ALCHEMY_CHAIN_NAMES!.trim().split(COMMAS_AND_SPACES);

  console.log(`Number of chains: ${alchemyChainNames.length}`);

  const thresholdWei = ethers.parseEther(thresholdEth);
  console.log(`Threshold in ETH: ${thresholdEth}`);
  console.log(`Threshold in Wei: ${thresholdWei.toString()}`);

  console.log(`Fee destination: ${feeDestination}`);

  return {
    thresholdWei,
    secretsArn,
    alchemyChainNames,
    feeDestination,
  };
};

const loadSecrets = async () => {
  // Initialize Secrets Manager client
  const secretsClient = new SecretsManagerClient();
  const secretsArn = process.env.SECRETS_ARN!;

  // Get API keys from Secrets Manager
  const secretResponse = await secretsClient.send(new GetSecretValueCommand({ SecretId: secretsArn }));

  // Parse secrets
  const secrets = JSON.parse(secretResponse.SecretString || "{}");

  const missingSecrets = ["ALCHEMY_API_KEY", "PRIVATE_KEY"].filter((key) => !secrets[key]);
  if (missingSecrets.length) {
    throw new SweeperError(`Missing secret${missingSecrets.length > 1 ? "s" : ""}: ${missingSecrets.join(", ")}`);
  }

  const alchemyApiKey = secrets.ALCHEMY_API_KEY!;
  const privateKey = secrets.PRIVATE_KEY!;

  return {
    alchemyApiKey,
    privateKey,
  };
};

const getConfiguration = async () => {
  return {
    ...loadEnvVars(),
    ...(await loadSecrets()),
  };
};

const run = async (config: Omit<ChainSweeperConfig, "alchemyChainName"> & { alchemyChainNames: string[] }) => {
  for (const alchemyChainName of config.alchemyChainNames) {
    try {
      console.log(`Processing chain: ${alchemyChainName}`);

      const chainSweeper = await ChainSweeper.create({
        ...config,
        alchemyChainName,
      });

      await chainSweeper.process();

      console.log(`Finished processing chain: ${alchemyChainName}`);
    } catch (error) {
      console.error(`Error processing chain ${alchemyChainName}:`, error);
    }
  }
};

export const handler = async (): Promise<any> => {
  try {
    const config = await getConfiguration();
    await run(config);

    return { statusCode: 200, body: "Processing complete" };
  } catch (error) {
    console.error("Lambda execution failed:", error instanceof SweeperError ? error.message : error);
    return { statusCode: 500, body: "Error processing chains" };
  }
};
