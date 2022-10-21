// ---- Return randomBytes as a challenge to test that the user has control of a provided address
import { ChallengePayload, RequestPayload } from "@gitcoin/passport-types";
import crypto from "crypto";
// request a challenge sig
export const getChallenge = (payload: RequestPayload): ChallengePayload => {
  // @TODO - expand this to allow providers to set custom challanges?
  const getChallengeString = (provider: string, nonce: string): string => {
    switch (provider) {
      case "SignerChallenge":
        return `I commit that this wallet is under my control and that I wish to link it with my Passport.\n\nnonce: ${nonce}`;
      case "Signer":
        return `I commit that I wish to register all ETH stamps associated with an Ethereum account that I control to my Passport.\n\naccount: ${payload.signer.address}\nnonce: ${nonce}`;
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
