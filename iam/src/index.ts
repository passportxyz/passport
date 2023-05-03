// import { EnsProvider } from './providers/ens';
// Should this file be an app factory? If it was, we could move the provider config to main.ts and test in isolation
import dotenv from "dotenv";

dotenv.config();

// ---- Server
import express, { Request } from "express";
import { router as procedureRouter } from "@gitcoin/passport-platforms/dist/commonjs/procedure-router";

import { SchemaEncoder, ZERO_BYTES32, NO_EXPIRATION } from "@ethereum-attestation-service/eas-sdk";

// ---- Production plugins
import cors from "cors";

// ---- Web3 packages
// import { ZERO_BYTES32, NO_EXPIRATION } from "@ethereum-attestation-service/eas-sdk";

// ---- Types
import { Response } from "express";
import {
  RequestPayload,
  ProofRecord,
  ChallengeRequestBody,
  VerifyRequestBody,
  CredentialResponseBody,
  ProviderContext,
  VerifiableCredential,
} from "@gitcoin/passport-types";

import { getChallenge } from "./utils/challenge";

// ---- Generate & Verify methods
import * as DIDKit from "@spruceid/didkit-wasm-node";
import {
  issueChallengeCredential,
  issueHashedCredential,
  verifyCredential,
} from "@gitcoin/passport-identity/dist/commonjs/src/credentials";

// All provider exports from platforms
import { providers } from "@gitcoin/passport-platforms";
import { utils, ethers } from "ethers";

// get DID from key
const key = process.env.IAM_JWK || DIDKit.generateEd25519Key();
const issuer = DIDKit.keyToDID("key", key);

// export the current config
export const config: {
  key: string;
  issuer: string;
} = {
  key,
  issuer,
};

const attestationSignerWallet = new ethers.Wallet(process.env.ATTESTATION_SIGNER_PRIVATE_KEY);
const attestationSchemaEncoder = new SchemaEncoder("string provider, string hash");

const ATTESTER_DOMAIN = {
  name: "Attester",
  version: "1",
  chainId: process.env.GITCOIN_ATTESTER_CHAIN_ID,
  verifyingContract: process.env.GITCOIN_ATTESTER_CONTRACT_ADDRESS,
};

const ATTESTER_TYPES = {
  Stamp: [
    { name: "provider", type: "string" },
    { name: "stampHash", type: "string" },
    { name: "expirationDate", type: "string" },
    { name: "encodedData", type: "bytes" },
  ],
  Passport: [
    { name: "stamps", type: "Stamp[]" },
    { name: "recipient", type: "address" },
    { name: "expirationTime", type: "uint64" },
    { name: "revocable", type: "bool" },
    { name: "refUID", type: "bytes32" },
    { name: "value", type: "uint256" },
  ],
};

// create the app and run on port
export const app = express();

// parse JSON post bodies
app.use(express.json());

// set cors to accept calls from anywhere
app.use(cors());

// return a JSON error response with a 400 status
const errorRes = async (res: Response, error: string, errorCode: number): Promise<Response> =>
  await new Promise((resolve) => resolve(res.status(errorCode).json({ error })));

// return response for given payload
const issueCredential = async (
  address: string,
  type: string,
  payload: RequestPayload,
  context: ProviderContext
): Promise<CredentialResponseBody> => {
  try {
    // if the payload includes an additional signer, use that to issue credential.
    if (payload.signer) {
      // We can assume that the signer is a valid address because the challenge was verified within the /verify endpoint
      payload.address = payload.signer.address;
    }
    // verify the payload against the selected Identity Provider
    const verifiedPayload = await providers.verify(type, payload, context);
    // check if the request is valid against the selected Identity Provider
    if (verifiedPayload && verifiedPayload?.valid === true) {
      // construct a set of Proofs to issue a credential against (this record will be used to generate a sha256 hash of any associated PII)
      const record: ProofRecord = {
        // type and address will always be known and can be obtained from the resultant credential
        type: verifiedPayload.record.pii ? `${type}#${verifiedPayload.record.pii}` : type,
        // version is defined by entry point
        version: "0.0.0",
        // extend/overwrite with record returned from the provider
        ...(verifiedPayload?.record || {}),
      };

      try {
        // generate a VC for the given payload
        const { credential } = await issueHashedCredential(DIDKit, key, address, record);

        return {
          record,
          credential,
        } as CredentialResponseBody;
      } catch (error: unknown) {
        if (error) {
          // return error msg indicating a failure producing VC
          throw {
            error: "Unable to produce a verifiable credential",
            code: 400,
          };
        }
      }
    } else {
      // return error message if an error is present
      // limit the error message string to 1000 chars
      throw {
        error:
          (verifiedPayload.error && verifiedPayload.error.join(", ").substring(0, 1000)) || "Unable to verify proofs",
        code: 403,
      };
    }
  } catch (error: unknown) {
    // error response
    throw error && (error as CredentialResponseBody).error
      ? error
      : {
          error: "Unable to verify with provider",
          code: 400,
        };
  }
};

// health check endpoint
app.get("/health", (req, res) => {
  const data = {
    message: "Ok",
    date: new Date(),
  };

  res.status(200).send(data);
});

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
    const challenge = getChallenge(payload);
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
            return void errorRes(res, "Unable to produce a verifiable credential", 400);
          }
        });
    } else {
      // return error message if an error present
      // limit the error message string to 1000 chars
      return void errorRes(
        res,
        (challenge.error && challenge.error.join(", ").substring(0, 1000)) || "Unable to verify proofs",
        403
      );
    }
  }

  if (!payload.address) {
    return void errorRes(res, "Missing address from challenge request body", 400);
  }

  if (!payload.type) {
    return void errorRes(res, "Missing type from challenge request body", 400);
  }
});

// expose verify entry point
app.post("/api/v0.0.0/verify", (req: Request, res: Response): void => {
  const requestBody: VerifyRequestBody = req.body as VerifyRequestBody;
  // each verify request should be received with a challenge credential detailing a signature contained in the RequestPayload.proofs
  const challenge = requestBody.challenge;
  // get the payload from the JSON req body
  const payload = requestBody.payload;
  // define a context to be shared between providers in the verify request
  // this is intended as a temporary storage for providers to share data
  const context: ProviderContext = {};

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
        payload.issuer = issuer;
        // the signer should be the address outlined in the challenge credential - rebuild the id to check for a full match
        const isSigner = challenge.credentialSubject.id === `did:pkh:eip155:1:${address}`;
        const isType = challenge.credentialSubject.provider === `challenge-${payload.type}`;

        // if an additional signer is passed verify that message was signed by passed signer address
        if (payload.signer) {
          const additionalChallenge = payload.signer.challenge;

          const additionalSignerCredential = await verifyCredential(DIDKit, additionalChallenge);

          const verifiedAddress = utils
            .getAddress(utils.verifyMessage(additionalChallenge.credentialSubject.challenge, payload.signer.signature))
            .toLocaleLowerCase();

          // if verifiedAddress does not equal the additional signer address throw an error because signature is invalid
          if (!additionalSignerCredential || verifiedAddress !== payload.signer.address) {
            return void errorRes(res, "Unable to verify payload", 401);
          }
        }

        // type is required because we need it to select the correct Identity Provider
        if (isSigner && isType && payload && payload.type) {
          // if multiple types are being requested - produce and return multiple vcs
          if (payload.types && payload.types.length) {
            // if payload.types then we want to iterate and return a VC for each type
            const responses: CredentialResponseBody[] = [];
            for (let i = 0; i < payload.types.length; i++) {
              try {
                const type = payload.types[i];
                const response = await issueCredential(address, type, payload, context);
                responses.push(response);
              } catch (error: unknown) {
                responses.push((await error) as CredentialResponseBody);
              }
            }

            // return multiple responses in an array
            return res.json(responses);
          } else {
            // make and return a single response
            return issueCredential(address, payload.type, payload, context)
              .then((response) => {
                return res.json(response);
              })
              .catch((error: CredentialResponseBody) => {
                return void errorRes(res, error.error, error.code);
              });
          }
        }
      }

      // error response
      return void errorRes(res, "Unable to verify payload", 401);
    })
    .catch(() => {
      return void errorRes(res, "Unable to verify payload", 500);
    });
});

export type EasStamp = {
  provider: string;
  stampHash: string;
  expirationDate: string;
  encodedData: string;
};

type EasPassport = {
  stamps: EasStamp[];
  recipient: string;
  expirationTime: number;
  revocable: boolean;
  refUID: string;
  value: number;
};

type EasPayload = {
  passport: EasPassport;
  signature: {
    v: number;
    r: string;
    s: string;
  };
  invalidCredentials: VerifiableCredential[];
};

// Expose entry point for getting eas payload for moving stamps on-chain
// This function will receive an array of stamps, validate them and return an array of eas payloads
app.post("/api/v0.0.0/eas", (req: Request, res: Response): void => {
  const credentials: VerifiableCredential[] = req.body as VerifiableCredential[];
  if (!credentials.length) return void errorRes(res, "No stamps provided", 400);

  const recipient = credentials[0].credentialSubject.id.split(":")[4];

  if (!(recipient && recipient.length === 42 && recipient.startsWith("0x")))
    return void errorRes(res, "Invalid recipient", 400);

  Promise.all(
    credentials.map(async (credential) => {
      return {
        credential,
        verified: issuer === credential.issuer && (await verifyCredential(DIDKit, credential)),
      };
    })
  )
    .then((credentialVerifications) => {
      const invalidCredentials = credentialVerifications
        .filter(({ verified }) => !verified)
        .map(({ credential }) => credential);

      const stamps: EasStamp[] = credentialVerifications
        .filter(({ verified }) => verified)
        .map(({ credential }) => {
          const encodedData = attestationSchemaEncoder.encodeData([
            { name: "provider", value: credential.credentialSubject.provider, type: "string" },
            { name: "hash", value: credential.credentialSubject.hash, type: "string" },
          ]);
          return {
            provider: credential.credentialSubject.provider,
            stampHash: credential.credentialSubject.hash,
            expirationDate: credential.expirationDate,
            // TODO is this the right data and format?
            encodedData,
          };
        });

      if (!stamps.length) return void errorRes(res, "No verifiable stamps provided", 400);

      const easPassport: EasPassport = {
        stamps,
        recipient,
        expirationTime: NO_EXPIRATION,
        revocable: true,
        refUID: ZERO_BYTES32,
        value: 0,
      };

      attestationSignerWallet
        ._signTypedData(ATTESTER_DOMAIN, ATTESTER_TYPES, easPassport)
        .then((signature) => {
          const { v, r, s } = utils.splitSignature(signature);

          const payload: EasPayload = {
            passport: easPassport,
            signature: { v, r, s },
            invalidCredentials,
          };

          return void res.json(payload);
        })
        .catch((error) => {
          // TODO dont return real error
          console.log("here0", error);
          return void errorRes(res, String(error), 500);
        });
    })
    .catch((error) => {
      // TODO dont return real error
      console.log("here1", error);
      return void errorRes(res, String(error), 500);
    });
});

// procedure endpoints
app.use("/procedure", procedureRouter);
