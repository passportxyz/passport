import { readFileSync } from "fs";
import { join, dirname } from "path";
import { initSync as humanNetworkInitSync, request_from_signer, enable_errors } from "@holonym-foundation/mishtiwasm";
import * as logger from "./logger.js";

// TODO: ideally this would be handled in the wasm module
process.on("uncaughtException", (err): void => {
  logger.error("Uncaught exception:", err);
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

export const humanNetworkOprf = async ({ value }: { value: string }): Promise<string> => {
  const signerUrl = process.env.HN_SIGNER_URL;

  if (!signerUrl) {
    throw new Error("HN_SIGNER_URL environment variable is required");
  }

  initializeHumanNetwork();

  // Remove trailing slash from signerUrl if present
  const baseUrl = signerUrl.endsWith("/") ? signerUrl.slice(0, -1) : signerUrl;

  // Use the mishtiwasm library to make the request
  return await request_from_signer(value, "OPRFSecp256k1", baseUrl);
};
