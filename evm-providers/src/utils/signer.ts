// ----- Types
import type { RequestPayload } from "@gitcoin/passport-types";

// ----- Credential verification
import * as DIDKit from "@spruceid/didkit-wasm-node";
import { verifyCredential } from "@gitcoin/passport-identity/dist/commonjs/src/credentials";

// ----- Verify signed message with ethers
import { utils } from "ethers";
import { JsonRpcProvider, JsonRpcSigner, StaticJsonRpcProvider } from "@ethersproject/providers";

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

// set the network rpc url based on env
const RPC_URL = process.env.RPC_URL;

export const getRPCProvider = async (
  payload: RequestPayload
): Promise<{ provider: JsonRpcSigner | JsonRpcProvider; address: string }> => {
  // return signer if provided
  if (payload.jsonRpcSigner) {
    const signer = payload.jsonRpcSigner;
    const address = await signer.getAddress();
    return {
      provider: signer,
      address,
    };
  }

  // define a provider using the rpc url
  const provider: StaticJsonRpcProvider = new StaticJsonRpcProvider(RPC_URL);
  const address = await getAddress(payload);
  return {
    provider,
    address,
  };
};
