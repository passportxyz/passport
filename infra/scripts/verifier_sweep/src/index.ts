import { createChainSweeper, processChainSweeper, ChainSweeperConfig, SweeperError } from "./ChainSweeper";
import { loadConfigFromEnv, loadConfigFromAWS } from "./configLoaders";

const processAllChains = async (
  config: Omit<ChainSweeperConfig, "alchemyChainName" | "feeDestination"> & { chainDepositAddresses: Record<string, string> }
): Promise<void> => {
  for (const [alchemyChainName, feeDestination] of Object.entries(config.chainDepositAddresses)) {
    console.log(`Processing chain: ${alchemyChainName}`);
    if (!feeDestination) {
      console.error(`No fee destination address found for chain: ${alchemyChainName}`);
      continue;
    }
    const sweeper = await createChainSweeper({
      ...config,
      alchemyChainName,
      feeDestination,
    });
    await processChainSweeper(sweeper);
    console.log(`Finished processing chain: ${alchemyChainName}`);
  }
};

export const handler = async (useEnv: boolean): Promise<{ statusCode: number; body: string }> => {
  try {
    const config = await (useEnv ? loadConfigFromEnv() : loadConfigFromAWS());
    console.log(
      "=====Environment=====\n",
      JSON.stringify(
        { ...config, privateKey: "<hidden>", alchemyApiKey: "<hidden>", thresholdWei: config.thresholdWei.toString() },
        null,
        2
      ),
      "\n===================="
    );
    await processAllChains(config);
    return { statusCode: 200, body: "Processing complete" };
  } catch (error) {
    console.error("Execution failed:", error instanceof SweeperError ? error.message : error);
    return { statusCode: 500, body: "Error processing chains" };
  }
};
