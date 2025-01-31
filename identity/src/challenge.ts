// ---- Return randomBytes as a challenge to test that the user has control of a provided address
import { ChallengePayload, RequestPayload, VerifyRequestBody } from "@gitcoin/passport-types";
import crypto from "crypto";
import { verifyDidChallenge } from "./verifyDidChallenge";
import { getAddress, verifyMessage } from "ethers";
// request a challenge sig
export const getChallenge = (payload: RequestPayload): ChallengePayload => {
  // @TODO - expand this to allow providers to set custom challanges?
  const getChallengeString = (provider: string, nonce: string): string => {
    switch (provider) {
      case "SignerChallenge":
        return `I commit that this wallet is under my control and that I wish to link it with my Passport.\n\nnonce: ${nonce}`;
      case "EVMBulkVerify":
        return `I commit that I wish to verify all the selected EVM stamps associated with my Passport.\n\nnonce: ${nonce}`;
      default:
        return `I commit that this stamp is my unique and only ${provider} verification for Passport.\n\nnonce: ${nonce}`;
    }
  };
  // check that we've been provided an address for the challenge
  if (payload.address) {
    // valid payload - create a challenge string
    return {
      valid: true,
      record: {
        address: payload.address,
        type: payload.type,
        challenge: getChallengeString(payload.type, crypto.randomBytes(32).toString("hex")),
      },
    };
  } else {
    // unable to create a challenge without address
    return {
      valid: false,
      error: ["Missing address"],
    };
  }
};

export const verifyChallengeAndGetAddress = async ({
  challenge,
  payload,
  signedChallenge,
}: VerifyRequestBody): Promise<string> => {
  // If signedChallenge is provided, use the did-session signed challenge
  // otherwise, use the old wallet signed challenge
  const uncheckedAddress = signedChallenge
    ? await verifyDidChallenge(signedChallenge, challenge.credentialSubject.challenge)
    : verifyMessage(challenge.credentialSubject.challenge, payload.proofs.signature);

  return getAddress(uncheckedAddress);
};
