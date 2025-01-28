// ----- Types
import type { RequestPayload } from "@gitcoin/passport-types";

// ----- Verify signed message with ethers
import { ethers, JsonRpcProvider } from "ethers";

export const getRPCProvider = (rpc: string): JsonRpcProvider => {
  const provider: JsonRpcProvider = new JsonRpcProvider(rpc);

  return provider;
};

// Get the address associated with the signer in the payload
// This function does not perform any validation of the challenge, we expect this to
// have been performed already before this function is called
export const getAddress = async ({ address, signer }: RequestPayload): Promise<string> => {
  // proof was missing/invalid return controller address from the payload
  return Promise.resolve(address);
};
