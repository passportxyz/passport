import { readFileSync } from "fs";
import { join, dirname } from "path";

import { initSync as humanNetworkInitSync, generate_oprf, enable_errors } from "@holonym-foundation/mishtiwasm";
import * as logger from "./logger.js";

// TODO: ideally this would be handled in the wasm module
process.on("uncaughtException", (err): void => {
  logger.error("Uncaught exception:", err); // eslint-disable-line no-console
  if (!err.toString().includes("RuntimeError: unreachable")) {
    throw err;
  }
});

let humanNetworkInitialized = false;
const initializeHumanNetwork = () => {
  if (humanNetworkInitialized) return;

  const monorepoBaseDir = dirname(process.cwd());

  // TODO: this is a hack to get the wasm path.
  // For docker builds, the wasm path is different and can be set in the Dockerfile
  const wasmPath =
    process.env.HUMAN_NETWORK_WASM_PATH ||
    join(monorepoBaseDir, "node_modules/@holonym-foundation/mishtiwasm/pkg/esm", "mishtiwasm_bg.wasm");

  // TODO leaving in in case there are any weird
  // issues in other environments, but can be removed
  // next time we're in this file
  logger.info("Loading wasm module", wasmPath);

  const wasmModuleBuffer = readFileSync(wasmPath);

  humanNetworkInitSync({ module: wasmModuleBuffer });
  enable_errors();

  humanNetworkInitialized = true;
};

export const humanNetworkOprf = async ({
  value,
  clientPrivateKey,
  relayUrl,
}: {
  value: string;
  clientPrivateKey: string;
  relayUrl: string;
}): Promise<string> => {
  initializeHumanNetwork();

  const encrypted = await generate_oprf(clientPrivateKey, value, "OPRFSecp256k1", relayUrl);

  return encrypted;
};
