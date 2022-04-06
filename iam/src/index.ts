// Should this file be an app factory? If it was, we could move the provider config to main.ts and test in isolation

// ---- Server
import express, { Request } from "express";

// ---- Web3 packages
import { utils } from "ethers";

// ---- Types
import { Response } from "express";
import {
  Payload,
  VerificationRecord,
  ChallengeRecord,
  ChallengeRequestBody,
  VerifyRequestBody,
  CredentialResponseBody,
} from "@dpopp/types";

// ---- Generate & Verify methods
import * as DIDKit from "@dpopp/identity/dist/commonjs/didkit-node";
import { issueChallengeCredential, issueMerkleCredential, verifyCredential } from "@dpopp/identity/dist/commonjs";

// ---- Identity Provider Management
import { Providers } from "./utils/providers";

// ---- Identity Providers
import { SimpleProvider } from "./providers/simple";

// Initiate providers - new Providers should be registered in this array...
const providers = new Providers([
  // Example provider which verifies the payload when `payload.proofs.valid === "true"`
  new SimpleProvider(),
]);

// create the app and run on port
export const app = express();

// parse JSON post bodys
app.use(express.json());

// // return a JSON error response with a 400 status
const errorRes = async (res: Response, error: string): Promise<Response> =>
  await new Promise((resolve) => resolve(res.status(400).json({ error })));

// @TODO - remove example key - this should be supplied by the .env
const key = JSON.stringify({
  kty: "OKP",
  crv: "Ed25519",
  x: "a7wbszn1DfZ3I7-_zDkUXCgypcGxL_cpCSTYEPRYj_o",
  d: "Z0hucmxRt1C22ygAXJ1arXwD9QlAA5tEPLb7qoXYDGY",
});

// get DID from key
const issuer = DIDKit.keyToDID("key", key);

// export the current config
export const config: {
  key: string;
  issuer: string;
} = {
  key,
  issuer,
};

// // expose challenge entry point
app.post("/api/v0.0.0/challenge", (req: Request, res: Response): void => {
  // get the payload from the JSON req body
  const requestBody: ChallengeRequestBody = req.body as ChallengeRequestBody;
  // console.log("requestBody", requestBody);
  const payload: Payload = requestBody.payload;
  // ensure address is checksummed
  payload.address = utils.getAddress(payload.address);
  // check for a valid payload
  if (payload.address && payload.type) {
    // check if the payload is valid against one of the providers
    const challenge = providers.getChallenge(payload);
    // check if the request was valid against Identity Providers
    if (challenge && challenge.valid === true) {
      // add additional fields to the record object so that we definitely produce a valid merkleTree
      const record = {
        // add fields to identify the bearer of the challenge
        type: payload.type,
        address: payload.address,
        // version as defined by entry point
        version: "0.0.0",
        // extend/overwrite with record returned from the provider
        ...(challenge?.record || {}),
      } as ChallengeRecord;

      // generate a VC for the given payload
      return void issueChallengeCredential(DIDKit, key, record).then((credential) => {
        // check error state and run safety check to ensure we're returning a valid VC
        if (credential.error) {
          // return error msg indicating a failure producing VC
          return errorRes(res, "Unable to produce a verifiable credential");
        }

        // return the verifiable credential
        return res.json(credential as CredentialResponseBody);
      });
    } else {
      // return error message if an error present
      return void errorRes(res, (challenge.error && challenge.error.join(", ")) || "Unable to verify proofs");
    }
  }

  // error response
  return void errorRes(res, "Unable to verify payload");
});

// expose verify entry point
app.post("/api/v0.0.0/verify", (req: Request, res: Response): void => {
  const requestBody: VerifyRequestBody = req.body as VerifyRequestBody;
  // each verify request should be received with a challenge credential detailing a signature contained in the Payload.proofs
  const challenge = requestBody.challenge;
  // get the payload from the JSON req body
  const payload = requestBody.payload;

  // Check the challenge and the payload is valid before issueing a credential from a registered provider
  return void verifyCredential(DIDKit, challenge).then((verified) => {
    if (verified && issuer === challenge.issuer) {
      // pull the address and checksum
      const address = utils.getAddress(
        utils.verifyMessage(challenge.credentialSubject.challenge, payload.proofs.signature)
      );
      // if the signer matches...
      const isSigner = challenge.credentialSubject.id === `did:ethr:${address}#challenge-${payload.type}`;
      // ensure the only address we save is that of the signer
      payload.address = address;
      // check for a valid payload
      if (isSigner && payload && payload.type) {
        // check if the payload is valid against one of the providers
        const verifiedChallenge = providers.verify(payload);
        // check if the request was valid against Identity Providers
        if (verifiedChallenge && verifiedChallenge?.valid === true) {
          // add additional fields to the record object so that we definitely produce a valid merkleTree
          const record = {
            // add enough fields to ensure the merkleTree is always valid
            type: payload.type,
            address: payload.address,
            // version as defined by entry point
            version: "0.0.0",
            // extend/overwrite with record returned from the provider
            ...(verifiedChallenge?.record || {}),
          } as VerificationRecord;

          // generate a VC for the given payload
          return issueMerkleCredential(DIDKit, key, record).then(({ credential, record }) => {
            // check error state and run safety check to ensure we're returning a valid VC
            if (Object.hasOwnProperty.call(credential, "error")) {
              // return error msg indicating a failure producing VC
              return errorRes(res, "Unable to produce a verifiable credential");
            }

            // return the verifiable credential
            return res.json({
              record,
              credential,
            } as CredentialResponseBody);
          });
        } else {
          // return error message if an error present
          return errorRes(
            res,
            (verifiedChallenge.error && verifiedChallenge.error.join(", ")) || "Unable to verify proofs"
          );
        }
      }
    }

    // error response
    return void errorRes(res, "Unable to verify payload");
  });
});
