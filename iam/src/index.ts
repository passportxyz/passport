// /* eslint-disable @typescript-eslint/no-unsafe-member-access */
// /* eslint-disable @typescript-eslint/no-unsafe-argument */
// /* eslint-disable @typescript-eslint/ban-ts-comment */
// // @ts-nocheck
// // ---- Server
import express from "express";
// import cors from "cors";

// // ---- Web3 packages
import { utils } from "ethers";

// // ---- Types
import { Response } from "express";
import { Challenge, ChallengeRecord, MerkleRecord, Payload, VerifiableCredential } from "@dpopp/types";

// // ---- Generate & Verify methods
import * as DIDKit from "@dpopp/identity/dist/commonjs/didkit-node";
import { issueChallengeCredential, issueMerkleCredential, verifyCredential } from "@dpopp/identity/dist/commonjs";

// // ---- Identity Provider Management
import { Providers } from "./utils/providers";

// // ---- Identity Providers
import { SimpleProvider } from "./providers/simple";

// // Initiate providers - new Providers should be registered in this array...
const providers = new Providers([
  // Example provider which verifies the payload when `payload.proofs.valid === "true"`
  new SimpleProvider(),
]);

// // create the app and run on port
export const app = express();
// const port = 65535; // default port to listen on

// // set cors to accept calls from anywhere
// app.use(cors());

// // parse JSON post bodys
app.use(express.json());

// // return a JSON error response with a 400 status
const errorRes = (res: Response, error: string) => res.status(400).json({ error });

// // @TODO - remove example key - this should be supplied by the .env
const key = JSON.stringify({
  kty: "OKP",
  crv: "Ed25519",
  x: "a7wbszn1DfZ3I7-_zDkUXCgypcGxL_cpCSTYEPRYj_o",
  d: "Z0hucmxRt1C22ygAXJ1arXwD9QlAA5tEPLb7qoXYDGY",
});

// // get DID from key
const issuer = DIDKit.keyToDID("key", key);

type ChallengeRequestBody = {
  payload: Payload;
};

// // expose challenge entry point
app.post("/api/v0.0.0/challenge", (req, res) => {
  // res.status(200).json(payload);
  console.log(req.body);
  //   // get the payload from the JSON req body
  const requestBody: ChallengeRequestBody = req.body as ChallengeRequestBody;
  console.log("requestBody", requestBody);
  const payload: Payload = requestBody.payload;
  console.log("payload ", payload);
  // res.status(200).json(payload);
  // ensure address is checksummed
  payload.address = utils.getAddress(payload.address);
  console.log("payload address ", payload.address);
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
      const resultantCredential = issueChallengeCredential(DIDKit, key, record).then((credential) => {
        // check error state and run safety check to ensure we're returning a valid VC
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument

        if (credential.error) {
          // return error msg indicating a failure producing VC
          return errorRes(res, "Unable to produce a verifiable credential");
        }

        const resultantVerifyCredential = verifyCredential(DIDKit, credential.credential as VerifiableCredential).then(
          (verifyCredential) => {
            if (!verifyCredential) {
              return errorRes(res, "Unable to produce a verifiable credential");
            } else {
              // return the verifiable credential
              return res.json(credential);
            }
          }
        );
      });
    } else {
      // return error message if an error present
      return errorRes(res, (challenge.error && challenge.error.join(", ")) || "Unable to verify proofs");
    }
  }

  // error response
  return errorRes(res, "Unable to verify payload");
});

// type VerifyRequestBody = {
//   challenge: Challenge;
//   payload: Payload;
// };

// // expose verify entry point
// /* eslint @typescript-eslint/no-misused-promises: "off" */
// app.post("/api/v0.0.0/verify", async (req, res) => {

//   const requestBody: VerifyRequestBody = req.body as VerifyRequestBody;

//   // each verify request should be received with a challenge credential detailing a signature contained in the Payload.proofs
//   const challenge = requestBody.challenge;
//   // get the payload from the JSON req body
//   const payload = requestBody.payload;
//   // first verify that we issued the challenge credential
//   if ((await verifyCredential(DIDKit, challenge)) && issuer === challenge.issuer) {
//     // pull the address and checksum
//     const address = utils.getAddress(
//       utils.verifyMessage(challenge.credentialSubject.challenge, payload.proofs.signature)
//     );
//     // if the signer matches...
//     const isSigner = challenge.credentialSubject.id === `did:ethr:${address}#challenge-${payload.type}`;
//     // ensure the only address we save is that of the signer
//     payload.address = address;
//     // check for a valid payload
//     if (isSigner && payload && payload.type) {
//       // check if the payload is valid against one of the providers
//       const verified = providers.verify(payload);
//       // check if the request was valid against Identity Providers
//       if (verified && verified?.valid === true) {
//         // add additional fields to the record object so that we definitely produce a valid merkleTree
//         const record = {
//           // add enough fields to ensure the merkleTree is always valid
//           type: payload.type,
//           address: payload.address,
//           // version as defined by entry point
//           version: "0.0.0",
//           // extend/overwrite with record returned from the provider
//           ...(verified?.record || {}),
//         } as MerkleRecord;

//         // generate a VC for the given payload
//         const { credential } = await issueMerkleCredential(DIDKit, key, record);

//         // check error state and run safety check to ensure we're returning a valid VC
//         if (credential.error || !(await verifyCredential(DIDKit, credential))) {
//           // return error msg indicating a failure producing VC
//           return errorRes(res, "Unable to produce a verifiable credential");
//         }

//         // return the verifiable credential
//         return res.json({
//           record,
//           credential,
//         });
//       } else {
//         // return error message if an error present
//         return errorRes(res, (verified.error && verified.error.join(", ")) || "Unable to verify proofs");
//       }
//     }
//   }

//   // error response
//   return errorRes(res, "Unable to verify payload");
// });

// start the Express server
// app.listen(port, () => {
//   console.log(`server started at http://localhost:${port}`);
// });
