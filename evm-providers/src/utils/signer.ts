// ----- Types
import type { RequestPayload } from "@gitcoin/passport-types";

// ----- Verify signed message with ethers
import { JsonRpcProvider, JsonRpcSigner, StaticJsonRpcProvider } from "@ethersproject/providers";

// set the network rpc url based on env
const RPC_URL = process.env.RPC_URL;

export const getRPCProvider = (payload: RequestPayload): JsonRpcSigner | JsonRpcProvider => {
  // return signer if provided
  console.log(payload.jsonRpcSigner, "payload.jsonRpcSigner");
  if (payload.jsonRpcSigner) {
    const signer = payload.jsonRpcSigner;
    return signer;
  }

  // pull rpc_url into payload
  // define a provider using the rpc url
  const provider: StaticJsonRpcProvider = new StaticJsonRpcProvider(RPC_URL);
  return provider;
};
