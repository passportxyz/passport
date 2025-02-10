import { readFileSync } from "fs";
import { join, dirname } from "path";

import { initSync as mishtiInitSync, generate_oprf } from "@holonym-foundation/mishtiwasm";

let mishtiInitialized = false;
const initializeMishti = () => {
  if (mishtiInitialized) return;

  const monorepoBaseDir = dirname(process.cwd());
  const wasmPath = join(monorepoBaseDir, "node_modules/@holonym-foundation/mishtiwasm/pkg/esm", "mishtiwasm_bg.wasm");

  // TODO leaving in in case there are any weird
  // issues in other environments, but can be removed
  // next time we're in this file
  console.log("Loading wasm module", wasmPath);

  const wasmModuleBuffer = readFileSync(wasmPath);

  mishtiInitSync({ module: wasmModuleBuffer });

  mishtiInitialized = true;
};

export const mishtiOprf = async ({
  value,
  clientPrivateKey,
  relayUrl,
}: {
  value: string;
  clientPrivateKey: string;
  relayUrl: string;
}) => {
  initializeMishti();

  const encrypted = await generate_oprf(clientPrivateKey, value, "OPRFSecp256k1", relayUrl);

  return encrypted;
};
