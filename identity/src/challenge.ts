// ---- Return randomBytes as a challenge to test that the user has control of a provided address
import {
  ChallengeRecord,
  RequestPayload,
  VerifyRequestBody,
} from "@gitcoin/passport-types";
import crypto from "crypto";
import { verifyDidChallenge } from "./verifyDidChallenge.js";
import { getAddress, verifyMessage } from "ethers";

const getChallengeString = (provider: string): string => {
  const nonce = crypto.randomBytes(32).toString("hex");
  switch (provider) {
    case "SignerChallenge":
      return `I commit that this wallet is under my control and that I wish to link it with my Passport.\n\nnonce: ${nonce}`;
    case "EVMBulkVerify":
      return `I commit that I wish to verify all the selected EVM stamps associated with my Passport.\n\nnonce: ${nonce}`;
    default:
      return `I commit that this stamp is my unique and only ${provider} verification for Passport.\n\nnonce: ${nonce}`;
  }
};

export const getChallengeRecord = (
  payload: RequestPayload,
): ChallengeRecord => {
  const challenge = getChallengeString(payload.type);

  return {
    address: payload.address,
    type: payload.type,
    challenge,
  };
};

export const verifyChallengeAndGetAddress = async ({
  challenge,
  payload,
  signedChallenge,
}: VerifyRequestBody): Promise<string> => {
  // If signedChallenge is provided, use the did-session signed challenge
  // otherwise, use the old wallet signed challenge
  const uncheckedAddress = signedChallenge
    ? await verifyDidChallenge(
        signedChallenge,
        challenge.credentialSubject.challenge,
      )
    : verifyMessage(
        challenge.credentialSubject.challenge,
        payload.proofs.signature,
      );

  return getAddress(uncheckedAddress);
};
