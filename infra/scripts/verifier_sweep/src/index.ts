import { createChainSweeper, processChainSweeper, ChainSweeperConfig, SweeperError } from "./ChainSweeper";
import { loadConfigFromEnv, loadConfigFromAWS } from "./configLoaders";

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

export const handler = async (useEnv: boolean): Promise<{ statusCode: number; body: string }> => {
  try {
    const config = await (useEnv ? loadConfigFromEnv() : loadConfigFromAWS());
    console.log(
      "=====Environment=====\n",
      JSON.stringify({ ...config, thresholdWei: config.thresholdWei.toString() }, null, 2),
      "\n===================="
    );
    await processAllChains(config);
    return { statusCode: 200, body: "Processing complete" };
  } catch (error) {
    console.error("Execution failed:", error instanceof SweeperError ? error.message : error);
    return { statusCode: 500, body: "Error processing chains" };
  }
};
