import { ethers } from "ethers";
import { ChainSweeper, ChainSweeperConfig, SweeperError } from "./ChainSweeper";

const COMMAS_AND_SPACES = /[\s,]+/;

const getConfiguration = () => {
  const missingVars = ["ALCHEMY_API_KEY", "PRIVATE_KEY", "ALCHEMY_CHAIN_NAMES"].filter((key) => !process.env[key]);
  if (missingVars.length) {
    throw new SweeperError(
      `Missing environment variable${missingVars.length > 1 ? "s" : ""}: ${missingVars.join(", ")}`
    );
  }

  const alchemyApiKey = process.env.ALCHEMY_API_KEY!;
  const privateKey = process.env.PRIVATE_KEY!; // Single private key for all chains
  const alchemyChainNamesStr = process.env.ALCHEMY_CHAIN_NAMES!; // List of tokens from Alchemy URLs, e.g., 'opt-mainnet opt-sepolia'
  const thresholdEth = process.env.BALANCE_THRESHOLD_ETH || "0.25";

  // Parse configuration
  const alchemyChainNames: string[] = alchemyChainNamesStr.trim().split(COMMAS_AND_SPACES);
  console.log(`Number of chains: ${alchemyChainNames.length}`);
  const thresholdWei = ethers.parseEther(thresholdEth);
  console.log(`Threshold in ETH: ${thresholdEth}`);
  console.log(`Threshold in Wei: ${thresholdWei.toString()}`);

  return {
    alchemyApiKey,
    privateKey,
    alchemyChainNames,
    thresholdWei,
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
    const config = getConfiguration();
    await run(config);

    return { statusCode: 200, body: "Processing complete" };
  } catch (error) {
    console.error("Lambda execution failed:", error instanceof SweeperError ? error.message : error);
    return { statusCode: 500, body: "Error processing chains" };
  }
};
