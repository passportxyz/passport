// Should this file be an app factory? If it was, we could move the provider config to main.ts and test in isolation
import dotenv from "dotenv";
dotenv.config();

// ---- Server
import express, { Request } from "express";
import { router as procedureRouter } from "./procedures";

// ---- Production plugins
import cors from "cors";

// ---- Web3 packages
import { utils } from "ethers";

// ---- Types
import { Response } from "express";
import {
  RequestPayload,
  ProofRecord,
  ChallengeRequestBody,
  VerifyRequestBody,
  CredentialResponseBody,
} from "@gitcoin/passport-types";

// ---- Generate & Verify methods
import * as DIDKit from "@spruceid/didkit-wasm-node";
import {
  issueChallengeCredential,
  issueHashedCredential,
  verifyCredential,
} from "@gitcoin/passport-identity/dist/commonjs/src/credentials";

// ---- Identity Provider Management
import { Providers } from "./utils/providers";

// ---- Identity Providers
import { SimpleProvider } from "./providers/simple";
import { GoogleProvider } from "./providers/google";
import { TwitterProvider } from "./providers/twitter";
import { EnsProvider } from "./providers/ens";
import { PohProvider } from "./providers/poh";
import { POAPProvider } from "./providers/poap";
import { FacebookProvider } from "./providers/facebook";
import { BrightIdProvider } from "./providers/brightid";
import { GithubProvider } from "./providers/github";

// Initiate providers - new Providers should be registered in this array...
const providers = new Providers([
  // Example provider which verifies the payload when `payload.proofs.valid === "true"`
  new SimpleProvider(),
  new GoogleProvider(),
  new TwitterProvider(),
  new EnsProvider(),
  new PohProvider(),
  new POAPProvider(),
  new FacebookProvider(),
  new BrightIdProvider(),
  new GithubProvider(),
]);

// create the app and run on port
export const app = express();

// parse JSON post bodys
app.use(express.json());

// set cors to accept calls from anywhere
app.use(cors());

// return a JSON error response with a 400 status
const errorRes = async (res: Response, error: string): Promise<Response> =>
  await new Promise((resolve) => resolve(res.status(400).json({ error })));

// health check endpoint
app.get("/health", (req, res) => {
  const data = {
    message: "Ok",
    date: new Date(),
  };

  res.status(200).send(data);
});

const key = process.env.IAM_JWK || DIDKit.generateEd25519Key();

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

// expose challenge entry point
app.post("/api/v0.0.0/challenge", (req: Request, res: Response): void => {
  // get the payload from the JSON req body
  const requestBody: ChallengeRequestBody = req.body as ChallengeRequestBody;
  // console.log("requestBody", requestBody);
  const payload: RequestPayload = requestBody.payload;
  // check for a valid payload
  if (payload.address && payload.type) {
    // ensure address is check-summed
    payload.address = utils.getAddress(payload.address);
    // generate a challenge for the given payload
    const challenge = providers.getChallenge(payload);
    // if the request is valid then proceed to generate a challenge credential
    if (challenge && challenge.valid === true) {
      // construct a request payload to issue a credential against
      const record: RequestPayload = {
        // add fields to identify the bearer of the challenge
        type: payload.type,
        address: payload.address,
        // version as defined by entry point
        version: "0.0.0",
        // extend/overwrite with record returned from the provider
        ...(challenge?.record || {}),
      };

      // generate a VC for the given payload
      return void issueChallengeCredential(DIDKit, key, record)
        .then((credential) => {
          // return the verifiable credential
          return res.json(credential as CredentialResponseBody);
        })
        .catch((error) => {
          if (error) {
            // return error msg indicating a failure producing VC
            return errorRes(res, "Unable to produce a verifiable credential");
          }
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
  // each verify request should be received with a challenge credential detailing a signature contained in the RequestPayload.proofs
  const challenge = requestBody.challenge;
  // get the payload from the JSON req body
  const payload = requestBody.payload;

  // Check the challenge and the payload is valid before issuing a credential from a registered provider
  return void verifyCredential(DIDKit, challenge)
    .then(async (verified) => {
      if (verified && issuer === challenge.issuer) {
        // pull the address and checksum so that its stored in a predictable format
        const address = utils.getAddress(
          utils.verifyMessage(challenge.credentialSubject.challenge, payload.proofs.signature)
        );
        // ensure the only address we save is that of the signer
        payload.address = address;
        // the signer should be the address outlined in the challenge credential - rebuild the id to check for a full match
        const isSigner = challenge.credentialSubject.id === `did:pkh:eip155:1:${address}`;
        const isType = challenge.credentialSubject.provider === `challenge-${payload.type}`;
        // type is required because we need it to select the correct Identity Provider
        if (isSigner && isType && payload && payload.type) {
          // each provider will apply business logic to the payload in-order to set the `valid` bool on the returned VerifiedPayload
          return providers
            .verify(payload)
            .then((verifiedPayload) => {
              // check if the request is valid against the selected Identity Provider
              if (verifiedPayload && verifiedPayload?.valid === true) {
                // construct a set of Proofs to issue a credential against (this record will be used to generate a sha256 hash of any associated PII)
                const record: ProofRecord = {
                  // type and address will always be known and can be obtained from the resultant credential
                  type: payload.type,
                  // version is defined by entry point
                  version: "0.0.0",
                  // extend/overwrite with record returned from the provider
                  ...(verifiedPayload?.record || {}),
                };

                // generate a VC for the given payload
                return issueHashedCredential(DIDKit, key, address, record)
                  .then(({ credential }) => {
                    return res.json({
                      record,
                      credential,
                    } as CredentialResponseBody);
                  })
                  .catch((error) => {
                    if (error) {
                      // return error msg indicating a failure producing VC
                      return errorRes(res, "Unable to produce a verifiable credential");
                    }
                  });
              } else {
                // return error message if an error is present
                return errorRes(
                  res,
                  (verifiedPayload.error && verifiedPayload.error.join(", ")) || "Unable to verify proofs"
                );
              }
            })
            .catch(() => {
              // error response
              return void errorRes(res, "Unable to verify with provider");
            });
        }
      }

      // error response
      return void errorRes(res, "Unable to verify payload");
    })
    .catch(() => {
      return void errorRes(res, "Unable to verify payload");
    });
});

// procedure endpoints
app.use("/procedure", procedureRouter);
