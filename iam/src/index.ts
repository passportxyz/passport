// import { EnsProvider } from './providers/ens';
// Should this file be an app factory? If it was, we could move the provider config to main.ts and test in isolation

// ---- Server
import express, { Request } from "express";
import { router as procedureRouter } from "@gitcoin/passport-platforms/procedure-router";

// ---- Production plugins
import cors from "cors";

// ---- Web3 packages
import { getAddress, Signature } from "ethers";

// ---- Types
import { Response } from "express";
import {
  RequestPayload,
  ChallengeRequestBody,
  VerifyRequestBody,
  CredentialResponseBody,
  CheckRequestBody,
  EasPayload,
  PassportAttestation,
  EasRequestBody,
} from "@gitcoin/passport-types";

import { passportOnchainInfo } from "@gitcoin/passport-identity/deployments";

import { getChallenge, verifyChallengeAndGetAddress } from "./utils/challenge.js";
import { getEASFeeAmount } from "./utils/easFees.js";
import * as stampSchema from "./utils/easStampSchema.js";
import * as passportSchema from "./utils/easPassportSchema.js";
import { hasValidIssuer, getIssuerKey } from "./issuers.js";
import { checkConditionsAndIssueCredentials } from "./utils/credentials.js";

// ---- Generate & Verify methods
import * as DIDKit from "@spruceid/didkit-wasm-node";
import {
  issueChallengeCredential,
  verifyCredential,
  verifyTypes,
  groupProviderTypesByPlatform,
} from "@gitcoin/passport-identity";

// All provider exports from platforms

import path from "path";
import { fileURLToPath } from "url";
import { VerifyDidChallengeBaseError } from "./utils/verifyDidChallenge.js";
import { errorRes, addErrorDetailsToMessage, ApiError } from "./utils/helpers.js";
import { ATTESTER_TYPES, getAttestationDomainSeparator, getAttestationSignerForChain } from "./utils/attestations.js";
import { scrollDevBadgeHandler } from "./utils/scrollDevBadge.js";
import { toJsonObject } from "./utils/json.js";
import { filterRevokedCredentials } from "./utils/revocations.js";

// ---- Config - check for all required env variables
// We want to prevent the app from starting with default values or if it is misconfigured
const configErrors = [];

if (!process.env.IAM_JWK) {
  configErrors.push("IAM_JWK is required");
}

if (!process.env.ATTESTATION_SIGNER_PRIVATE_KEY) {
  configErrors.push("ATTESTATION_SIGNER_PRIVATE_KEY is required");
}

if (!process.env.TESTNET_ATTESTATION_SIGNER_PRIVATE_KEY) {
  configErrors.push("TESTNET_ATTESTATION_SIGNER_PRIVATE_KEY is required");
}

if (!process.env.ALLO_SCORER_ID) {
  configErrors.push("ALLO_SCORER_ID is required");
}

if (!process.env.SCORER_ENDPOINT) {
  configErrors.push("SCORER_ENDPOINT is required");
}

if (!process.env.SCORER_API_KEY) {
  configErrors.push("SCORER_API_KEY is required");
}

if (!process.env.EAS_GITCOIN_STAMP_SCHEMA) {
  configErrors.push("EAS_GITCOIN_STAMP_SCHEMA is required");
}

if (!process.env.MORALIS_API_KEY) {
  configErrors.push("MORALIS_API_KEY is required");
}

if (!process.env.IAM_JWK_EIP712) {
  configErrors.push("IAM_JWK_EIP712 is required");
}

if (!process.env.EAS_FEE_USD) {
  configErrors.push("EAS_FEE_USD is required");
}

if (!process.env.SCROLL_BADGE_PROVIDER_INFO) {
  configErrors.push("SCROLL_BADGE_PROVIDER_INFO is required");
}

if (!process.env.SCROLL_BADGE_ATTESTATION_SCHEMA_UID) {
  configErrors.push("SCROLL_BADGE_ATTESTATION_SCHEMA_UID is required");
}

if (configErrors.length > 0) {
  configErrors.forEach((error) => console.error(error)); // eslint-disable-line no-console
  throw new Error("Missing required configuration");
}

const EAS_FEE_USD = parseFloat(process.env.EAS_FEE_USD);

// create the app and run on port
export const app = express();

// parse JSON post bodies
app.use(express.json());

// set cors to accept calls from anywhere
app.use(cors());

// health check endpoint
app.get("/health", (_req, res) => {
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
  const payload: RequestPayload = requestBody.payload;

  // check for a valid payload
  if (payload.address && payload.type) {
    // ensure address is check-summed
    payload.address = getAddress(payload.address);
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

      const currentKey = getIssuerKey(payload.signatureType);
      // generate a VC for the given payload
      return void issueChallengeCredential(DIDKit, currentKey, record, payload.signatureType)
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

app.post("/api/v0.0.0/check", (req: Request, res: Response): void => {
  const { payload } = req.body as CheckRequestBody;

  if (!payload || !(payload.type || payload.types)) {
    return void errorRes(res, "Incorrect payload", 400);
  }

  const types = (payload.types?.length ? payload.types : [payload.type]).filter((type) => type);
  const typesGroupedByPlatform = groupProviderTypesByPlatform(types);
  verifyTypes(typesGroupedByPlatform, payload)
    .then((results) => {
      const responses = results.map(({ verifyResult, type, error, code }) => ({
        valid: verifyResult.valid,
        type,
        error,
        code,
      }));
      res.json(responses);
    })
    .catch(() => errorRes(res, "Unable to check payload", 500));
});

// expose verify entry point
// verify a users claim to stamps and issue the stamps if the claim is valid
app.post("/api/v0.0.0/verify", (req: Request, res: Response): void => {
  const requestBody: VerifyRequestBody = req.body as VerifyRequestBody;
  // each verify request should be received with a challenge credential detailing a signature contained in the RequestPayload.proofs
  const challenge = requestBody.challenge;
  // get the payload from the JSON req body
  const payload = requestBody.payload;

  console.log("geri ---verify", 1);

  // Check the challenge and the payload is valid before issuing a credential from a registered provider
  return void verifyCredential(DIDKit, challenge)
    .then(async (verified) => {
      console.log("geri ---verify", 2);
      if (verified && hasValidIssuer(challenge.issuer)) {
        let address;
        try {
          console.log("geri ---verify", 3);
          address = await verifyChallengeAndGetAddress(requestBody);
        } catch (error) {
          if (error instanceof VerifyDidChallengeBaseError) {
            return void errorRes(res, `Invalid challenge signature: ${error.name}`, 401);
          }
          throw error;
        }

        payload.address = address;

        console.log("geri ---verify", 4);
        // Check signer and type
        const isSigner = challenge.credentialSubject.id === `did:pkh:eip155:1:${address}`;
        const isType = challenge.credentialSubject.provider === `challenge-${payload.type}`;

        console.log("geri ---verify 4.1 isSigner", isSigner);
        console.log("geri ---verify 4.2 isType", isType);
        console.log("geri ---verify 4.2 provider", challenge.credentialSubject.provider);
        if (!isSigner || !isType) {
          return void errorRes(
            res,
            "Invalid challenge '" +
              [!isSigner && "signer", !isType && "provider"].filter(Boolean).join("' and '") +
              "'",
            401
          );
        }

        console.log("geri ---verify", 5);
        const credentials = await checkConditionsAndIssueCredentials(payload, address);
        console.log("geri ---verify", 6);

        console.log("geri ---verify", 6.1);

        return void res.json(credentials);
      }

      // error response
      return void errorRes(res, "Unable to verify payload", 401);
    })
    .catch((error) => {
      console.log("geri ---verify 7", error);
      if (error instanceof ApiError) {
        return void errorRes(res, error.message, error.code);
      }
      let message = "Unable to verify payload";
      if (error instanceof Error) message += `: ${error.name}`;
      return void errorRes(res, message, 500);
    });
});

// Expose entry point for getting eas payload for moving stamps on-chain (Stamp Attestations)
// This function will receive an array of stamps, validate them and return an array of eas payloads
app.post("/api/v0.0.0/eas", (req: Request, res: Response): void => {
  try {
    const { credentials, nonce, chainIdHex } = req.body as EasRequestBody;
    if (!Object.keys(passportOnchainInfo).includes(chainIdHex)) {
      return void errorRes(res, `No onchainInfo found for chainId ${chainIdHex}`, 404);
    }
    const attestationChainIdHex = chainIdHex as keyof typeof passportOnchainInfo;

    if (!credentials.length) return void errorRes(res, "No stamps provided", 400);

    const recipient = credentials[0].credentialSubject.id.split(":")[4];

    if (!(recipient && recipient.length === 42 && recipient.startsWith("0x")))
      return void errorRes(res, "Invalid recipient", 400);

    if (!credentials.every((credential) => credential.credentialSubject.id.split(":")[4] === recipient))
      return void errorRes(res, "Every credential's id must be equivalent", 400);

    filterRevokedCredentials(credentials)
      .then((unrevokedCredentials) => {
        Promise.all(
          unrevokedCredentials.map(async (credential) => {
            return {
              credential,
              verified: hasValidIssuer(credential.issuer) && (await verifyCredential(DIDKit, credential)),
            };
          })
        )
          .then(async (credentialVerifications) => {
            const invalidCredentials = credentialVerifications
              .filter(({ verified }) => !verified)
              .map(({ credential }) => credential);

            if (invalidCredentials.length > 0) {
              return void errorRes(res, { invalidCredentials }, 400);
            }

            const multiAttestationRequest = await stampSchema.formatMultiAttestationRequest(
              credentialVerifications,
              recipient,
              attestationChainIdHex
            );

            const fee = await getEASFeeAmount(EAS_FEE_USD);
            const passportAttestation: PassportAttestation = {
              multiAttestationRequest,
              nonce: Number(nonce),
              fee: fee.toString(),
            };

            const domainSeparator = getAttestationDomainSeparator(attestationChainIdHex);

            const signer = await getAttestationSignerForChain(attestationChainIdHex);

            signer
              .signTypedData(domainSeparator, ATTESTER_TYPES, passportAttestation)
              .then((signature) => {
                const { v, r, s } = Signature.from(signature);

                const payload: EasPayload = {
                  passport: passportAttestation,
                  signature: { v, r, s },
                  invalidCredentials,
                };

                return void res.type("application/json").send(toJsonObject(payload));
              })
              .catch(() => {
                return void errorRes(res, "Error signing passport", 500);
              });
          })
          .catch(() => {
            return void errorRes(res, "Error formatting onchain passport", 500);
          });
      })
      .catch(() => {
        return void errorRes(res, "Error formatting onchain passport", 500);
      });
  } catch (error) {
    return void errorRes(res, String(error), 500);
  }
});

app.post("/api/v0.0.0/scroll/dev", scrollDevBadgeHandler);

// Expose entry point for getting eas payload for moving stamps on-chain (Passport Attestations)
// This function will receive an array of stamps, validate them and return an array of eas payloads
app.post("/api/v0.0.0/eas/passport", (req: Request, res: Response): void => {
  try {
    const { recipient, credentials, nonce, chainIdHex, customScorerId } = req.body as EasRequestBody;
    if (!Object.keys(passportOnchainInfo).includes(chainIdHex)) {
      return void errorRes(res, `No onchainInfo found for chainId ${chainIdHex}`, 404);
    }
    const attestationChainIdHex = chainIdHex as keyof typeof passportOnchainInfo;

    if (!credentials || !credentials.length) return void errorRes(res, "No stamps provided", 400);

    if (!(recipient && recipient.length === 42 && recipient.startsWith("0x")))
      return void errorRes(res, "Invalid recipient", 400);

    if (
      !credentials.every(
        (credential) =>
          credential.credentialSubject.id.split(":")[4].toLocaleLowerCase() === recipient.toLocaleLowerCase()
      )
    )
      return void errorRes(res, "Every credential's id must be equivalent to that of the recipient", 400);

    filterRevokedCredentials(credentials)
      .then((unrevokedCredentials) => {
        Promise.all(
          unrevokedCredentials.map(async (credential) => {
            return {
              credential,
              verified: hasValidIssuer(credential.issuer) && (await verifyCredential(DIDKit, credential)),
            };
          })
        )
          .then(async (credentialVerifications) => {
            const invalidCredentials = credentialVerifications
              .filter(({ verified }) => !verified)
              .map(({ credential }) => credential);

            const multiAttestationRequest = await passportSchema.formatMultiAttestationRequestWithPassportAndScore(
              credentialVerifications,
              recipient,
              attestationChainIdHex,
              customScorerId
            );

            const fee = await getEASFeeAmount(EAS_FEE_USD);
            const passportAttestation: PassportAttestation = {
              multiAttestationRequest,
              nonce: Number(nonce),
              fee: fee.toString(),
            };

            const domainSeparator = getAttestationDomainSeparator(attestationChainIdHex);

            const signer = await getAttestationSignerForChain(attestationChainIdHex);

            signer
              .signTypedData(domainSeparator, ATTESTER_TYPES, passportAttestation)
              .then((signature) => {
                const { v, r, s } = Signature.from(signature);

                const payload: EasPayload = {
                  passport: passportAttestation,
                  signature: { v, r, s },
                  invalidCredentials,
                };

                return void res.json(toJsonObject(payload));
              })
              .catch((): void => {
                return void errorRes(res, "Error signing passport", 500);
              });
          })
          .catch((error) => {
            const message = addErrorDetailsToMessage("Error formatting onchain passport", error);
            return void errorRes(res, message, 500);
          });
      })
      .catch((error) => {
        const message = addErrorDetailsToMessage("Error formatting onchain passport", error);
        return void errorRes(res, message, 500);
      });
  } catch (error) {
    const message = addErrorDetailsToMessage("Unexpected error when processing request", error);
    return void errorRes(res, message, 500);
  }
});

// Expose entry point for getting eas payload for moving only the score on-chain (Score Attestations)
app.post("/api/v0.0.0/eas/score", async (req: Request, res: Response) => {
  try {
    const { recipient, nonce, chainIdHex, customScorerId } = req.body as EasRequestBody;
    if (!Object.keys(passportOnchainInfo).includes(chainIdHex)) {
      return void errorRes(res, `No onchainInfo found for chainId ${chainIdHex}`, 404);
    }
    const attestationChainIdHex = chainIdHex as keyof typeof passportOnchainInfo;

    if (!(recipient && recipient.length === 42 && recipient.startsWith("0x")))
      return void errorRes(res, "Invalid recipient", 400);

    try {
      const multiAttestationRequest = await passportSchema.formatMultiAttestationRequestWithScore(
        recipient,
        attestationChainIdHex,
        customScorerId
      );

      const fee = await getEASFeeAmount(EAS_FEE_USD);
      const passportAttestation: PassportAttestation = {
        multiAttestationRequest,
        nonce: Number(nonce),
        fee: fee.toString(),
      };

      const domainSeparator = getAttestationDomainSeparator(attestationChainIdHex);

      const signer = await getAttestationSignerForChain(attestationChainIdHex);

      signer
        .signTypedData(domainSeparator, ATTESTER_TYPES, passportAttestation)
        .then((signature) => {
          const { v, r, s } = Signature.from(signature);

          const payload: EasPayload = {
            passport: passportAttestation,
            signature: { v, r, s },
            invalidCredentials: [],
          };

          return void res.json(toJsonObject(payload));
        })
        .catch(() => {
          return void errorRes(res, "Error signing score", 500);
        });
    } catch (error) {
      const message = addErrorDetailsToMessage("Error formatting onchain score", error);
      return void errorRes(res, message, 500);
    }
  } catch (error) {
    const message = addErrorDetailsToMessage("Unexpected error when processing request", error);
    return void errorRes(res, message, 500);
  }
});

// procedure endpoints
app.use("/procedure", procedureRouter);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use("/static", express.static(path.join(__dirname, "static")));
