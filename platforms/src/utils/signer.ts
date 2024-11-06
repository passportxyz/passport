// ----- Types
import type { RequestPayload } from "@gitcoin/passport-types";

// ----- Credential verification
import * as DIDKit from "@spruceid/didkit-wasm";
import { verifyCredential } from "@gitcoin/passport-identity";

// ----- Verify signed message with ethers
import { ethers, JsonRpcProvider } from "ethers";

export const getRPCProvider = (rpc: string): JsonRpcProvider => {
  const provider: JsonRpcProvider = new JsonRpcProvider(rpc);

  return provider;
};

// get the address associated with the signer in the payload
export const getAddress = async ({ address, signer }: RequestPayload): Promise<string> => {
  // if signer proof is provided, check validity and return associated address instead of controller
  if (signer && signer.challenge && signer.signature) {
    // test the provided credential has not been tampered with
    const verified = await verifyCredential(DIDKit, signer.challenge);
    // check the credential was issued by us for this user...
    // Regarding the issuer, this is not verified here. If the issuer is one of the valid (trusted)
    // issuers should be checked before calling this function.
    if (verified && address === signer.challenge.credentialSubject.address) {
      // which ever wallet signed this message is the wallet we want to use in provider verifications
      return ethers.getAddress(ethers.verifyMessage(signer.challenge.credentialSubject.challenge, signer.signature));
    }
  }

  // proof was missing/invalid return controller address from the payload
  return address;
};
