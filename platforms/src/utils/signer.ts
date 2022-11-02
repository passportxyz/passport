// ----- Types
import type { RequestPayload } from "@gitcoin/passport-types";

// ----- Credential verification
import * as DIDKit from "@spruceid/didkit-wasm";
import { verifyCredential } from "@gitcoin/passport-identity/dist/commonjs/src/credentials";

// ----- Verify signed message with ethers
import { utils } from "ethers";

// ----- Verify signed message with ethers
import { JsonRpcProvider, JsonRpcSigner, StaticJsonRpcProvider } from "@ethersproject/providers";

// ----- Credential verification
import * as DIDKit from "@spruceid/didkit-wasm-node";
import { verifyCredential } from "@gitcoin/passport-identity/dist/commonjs/src/credentials";

// ----- Verify signed message with ethers
import { utils } from "ethers";

// set the network rpc url based on env
const RPC_URL = process.env.RPC_URL;

export const getRPCProvider = (payload: RequestPayload): JsonRpcSigner | JsonRpcProvider => {
  // return signer if provided
  if (payload.jsonRpcSigner) {
    const signer = payload.jsonRpcSigner;
    return signer;
  }

  const rpcUrl = payload.rpcUrl || RPC_URL;
  // pull rpc_url into payload
  // define a provider using the rpc url

  const provider: StaticJsonRpcProvider = new StaticJsonRpcProvider(rpcUrl);
  return provider;
};

// get the address associated with the signer in the payload
export const getAddress = async ({ address, signer, issuer }: RequestPayload): Promise<string> => {
  // if signer proof is provided, check validity and return associated address instead of controller
  if (signer && signer.challenge && signer.signature) {
    // test the provided credential has not been tampered with
    const verified = await verifyCredential(DIDKit, signer.challenge);
    // check the credential was issued by us for this user...
    if (verified && issuer === signer.challenge.issuer && address === signer.challenge.credentialSubject.address) {
      // which ever wallet signed this message is the wallet we want to use in provider verifications
      return utils.getAddress(utils.verifyMessage(signer.challenge.credentialSubject.challenge, signer.signature));
    }
  }

  // proof was missing/invalid return controller address from the payload
  return address;
};
