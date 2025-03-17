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

import passportOnchainInfo from "../../deployments/onchainInfo.json" with { type: "json" };

import {
  getChallenge,
  hasValidIssuer,
  getIssuerInfo,
  VerifyDidChallengeBaseError,
  issueChallengeCredential,
  verifyCredential,
  verifyTypes,
  groupProviderTypesByPlatform,
  verifyProvidersAndIssueCredentials,
  verifyChallengeAndGetAddress,
} from "./utils/identityHelper.js";

import { getEASFeeAmount } from "./utils/easFees.js";
import * as stampSchema from "./utils/easStampSchema.js";
import * as passportSchema from "./utils/easPassportSchema.js";

// ---- Generate & Verify methods
import * as DIDKit from "@spruceid/didkit-wasm-node";

// All provider exports from platforms

import path from "path";
import { fileURLToPath } from "url";
import {
  errorRes,
  addErrorDetailsToMessage,
  ApiError,
} from "./utils/helpers.js";
import {
  ATTESTER_TYPES,
  getAttestationDomainSeparator,
  getAttestationSignerForChain,
} from "./utils/attestations.js";
import { scrollDevBadgeHandler } from "./utils/scrollDevBadge.js";
import { toJsonObject } from "./utils/json.js";
import { filterRevokedCredentials } from "./utils/revocations.js";
import { generateScoreAttestationRequest } from "./utils/easScoreSchema.js";

// ---- Config - check for all required env variables
// We want to prevent the app from starting with default values or if it is misconfigured
const configErrors = [
  "IAM_JWK",
  "ATTESTATION_SIGNER_PRIVATE_KEY",
  "TESTNET_ATTESTATION_SIGNER_PRIVATE_KEY",
  "ALLO_SCORER_ID",
  "SCORER_ENDPOINT",
  "SCORER_API_KEY",
  "EAS_GITCOIN_STAMP_SCHEMA",
  "MORALIS_API_KEY",
  "IAM_JWK_EIP712",
  "EAS_FEE_USD",
  "SCROLL_BADGE_PROVIDER_INFO",
  "SCROLL_BADGE_ATTESTATION_SCHEMA_UID",
  "HUMAN_NETWORK_CLIENT_PRIVATE_KEY",
  "HUMAN_NETWORK_RELAY_URL",
]
  .map((env) => (process.env[env] ? null : `${env} is required`))
  .filter(Boolean);

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

      const { issuer } = getIssuerInfo();
      // generate a VC for the given payload
      return void issueChallengeCredential(
        DIDKit,
        issuer.key,
        record,
        payload.signatureType,
      )
        .then((credential) => {
          // return the verifiable credential
          return res.json(credential as CredentialResponseBody);
        })
        .catch((error): void => {
          if (error) {
            // return error msg indicating a failure producing VC
            return void errorRes(
              res,
              "Unable to produce a verifiable credential",
              400,
            );
          }
        });
    } else {
      // return error message if an error present
      // limit the error message string to 1000 chars
      return void errorRes(
        res,
        (challenge.error && challenge.error.join(", ").substring(0, 1000)) ||
          "Unable to verify proofs",
        403,
      );
    }
  }

  if (!payload.address) {
    return void errorRes(
      res,
      "Missing address from challenge request body",
      400,
    );
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

  const types = (payload.types?.length ? payload.types : [payload.type]).filter(
    (type) => type,
  );
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

  // Check the challenge and the payload is valid before issuing a credential from a registered provider
  return void verifyCredential(DIDKit, challenge)
    .then(async (verified): Promise<void> => {
      if (verified && hasValidIssuer(challenge.issuer)) {
        let address;
        try {
          address = await verifyChallengeAndGetAddress(requestBody);
        } catch (error) {
          if (error instanceof VerifyDidChallengeBaseError) {
            return void errorRes(
              res,
              `Invalid challenge signature: ${error.name}`,
              401,
            );
          }
          throw error;
        }

        payload.address = address;

        // Check signer and type
        const isSigner =
          challenge.credentialSubject.id === `did:pkh:eip155:1:${address}`;
        const isType =
          challenge.credentialSubject.provider === `challenge-${payload.type}`;

        if (!isSigner || !isType) {
          return void errorRes(
            res,
            "Invalid challenge '" +
              [!isSigner && "signer", !isType && "provider"]
                .filter(Boolean)
                .join("' and '") +
              "'",
            401,
          );
        }

        const types = payload.types.filter((type) => type);
        const providersGroupedByPlatforms = groupProviderTypesByPlatform(types);

        const credentials = await verifyProvidersAndIssueCredentials(
          providersGroupedByPlatforms,
          address,
          payload,
        );

        return void res.json(credentials);
      }

      // error response
      return void errorRes(res, "Unable to verify payload", 401);
    })
    .catch((error): void => {
      if (error instanceof ApiError) {
        return void errorRes(res, error.message, error.code);
      }
      let message = "Unable to verify payload";
      if (error instanceof Error) message += `: ${error.name}`;
      return void errorRes(res, message, 500);
    });
});

const isChainIdHexValid = (
  value: string,
): value is keyof typeof passportOnchainInfo =>
  Object.keys(passportOnchainInfo).includes(value);

// TODO Once we've fully migrated, we should probably remove
// all the other eas endpoints and the relevant code in the
// utils folder and just keep this one
app.post(
  "/api/v0.0.0/eas/scoreV2",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { recipient, nonce, chainIdHex, customScorerId } =
        req.body as EasRequestBody;

      if (!isChainIdHexValid(chainIdHex)) {
        return void errorRes(
          res,
          `No onchainInfo found for chainId ${chainIdHex}`,
          404,
        );
      }

      if (!(recipient && recipient.length === 42 && recipient.startsWith("0x")))
        return void errorRes(res, "Invalid recipient", 400);

      const scoreAttestationRequest = await generateScoreAttestationRequest({
        recipient,
        chainIdHex,
        customScorerId,
      });

      const fee = await getEASFeeAmount(EAS_FEE_USD);
      const scoreAttestation: PassportAttestation = {
        multiAttestationRequest: scoreAttestationRequest,
        nonce: Number(nonce),
        fee: fee.toString(),
      };

      const domainSeparator = getAttestationDomainSeparator(chainIdHex);

      const signer = await getAttestationSignerForChain(chainIdHex);

      const signature = await signer.signTypedData(
        domainSeparator,
        ATTESTER_TYPES,
        scoreAttestation,
      );
      const { v, r, s } = Signature.from(signature);

      const payload: EasPayload = {
        passport: scoreAttestation,
        signature: { v, r, s },
        invalidCredentials: [],
      };

      return void res.json(toJsonObject(payload));
    } catch (error) {
      const message = addErrorDetailsToMessage(
        "Unexpected error generating score attestation",
        error,
      );
      return void errorRes(res, message, 500);
    }
  },
);

// Expose entry point for getting eas payload for moving stamps on-chain (Stamp Attestations)
// This function will receive an array of stamps, validate them and return an array of eas payloads
app.post("/api/v0.0.0/eas", (req: Request, res: Response): void => {
  try {
    const { credentials, nonce, chainIdHex } = req.body as EasRequestBody;
    if (!isChainIdHexValid(chainIdHex)) {
      return void errorRes(
        res,
        `No onchainInfo found for chainId ${chainIdHex}`,
        404,
      );
    }

    if (!credentials.length)
      return void errorRes(res, "No stamps provided", 400);

    const recipient = credentials[0].credentialSubject.id.split(":")[4];

    if (!(recipient && recipient.length === 42 && recipient.startsWith("0x")))
      return void errorRes(res, "Invalid recipient", 400);

    if (
      !credentials.every(
        (credential) =>
          credential.credentialSubject.id.split(":")[4] === recipient,
      )
    )
      return void errorRes(
        res,
        "Every credential's id must be equivalent",
        400,
      );

    filterRevokedCredentials(credentials)
      .then((unrevokedCredentials) => {
        Promise.all(
          unrevokedCredentials.map(async (credential) => {
            return {
              credential,
              verified:
                hasValidIssuer(credential.issuer) &&
                (await verifyCredential(DIDKit, credential)),
            };
          }),
        )
          .then(async (credentialVerifications): Promise<void> => {
            const invalidCredentials = credentialVerifications
              .filter(({ verified }) => !verified)
              .map(({ credential }) => credential);

            if (invalidCredentials.length > 0) {
              return void errorRes(res, { invalidCredentials }, 400);
            }

            const multiAttestationRequest =
              await stampSchema.formatMultiAttestationRequest(
                credentialVerifications,
                recipient,
                chainIdHex,
              );

            const fee = await getEASFeeAmount(EAS_FEE_USD);
            const passportAttestation: PassportAttestation = {
              multiAttestationRequest,
              nonce: Number(nonce),
              fee: fee.toString(),
            };

            const domainSeparator = getAttestationDomainSeparator(chainIdHex);

            const signer = await getAttestationSignerForChain(chainIdHex);

            signer
              .signTypedData(
                domainSeparator,
                ATTESTER_TYPES,
                passportAttestation,
              )
              .then((signature): void => {
                const { v, r, s } = Signature.from(signature);

                const payload: EasPayload = {
                  passport: passportAttestation,
                  signature: { v, r, s },
                  invalidCredentials,
                };

                return void res
                  .type("application/json")
                  .send(toJsonObject(payload));
              })
              .catch((): void => {
                return void errorRes(res, "Error signing passport", 500);
              });
          })
          .catch((): void => {
            return void errorRes(res, "Error formatting onchain passport", 500);
          });
      })
      .catch((): void => {
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
    const { recipient, credentials, nonce, chainIdHex, customScorerId } =
      req.body as EasRequestBody;
    if (!isChainIdHexValid(chainIdHex)) {
      return void errorRes(
        res,
        `No onchainInfo found for chainId ${chainIdHex}`,
        404,
      );
    }

    if (!credentials || !credentials.length)
      return void errorRes(res, "No stamps provided", 400);

    if (!(recipient && recipient.length === 42 && recipient.startsWith("0x")))
      return void errorRes(res, "Invalid recipient", 400);

    if (
      !credentials.every(
        (credential) =>
          credential.credentialSubject.id.split(":")[4].toLocaleLowerCase() ===
          recipient.toLocaleLowerCase(),
      )
    )
      return void errorRes(
        res,
        "Every credential's id must be equivalent to that of the recipient",
        400,
      );

    filterRevokedCredentials(credentials)
      .then((unrevokedCredentials) => {
        Promise.all(
          unrevokedCredentials.map(async (credential) => {
            return {
              credential,
              verified:
                hasValidIssuer(credential.issuer) &&
                (await verifyCredential(DIDKit, credential)),
            };
          }),
        )
          .then(async (credentialVerifications) => {
            const invalidCredentials = credentialVerifications
              .filter(({ verified }) => !verified)
              .map(({ credential }) => credential);

            const multiAttestationRequest =
              await passportSchema.formatMultiAttestationRequestWithPassportAndScore(
                credentialVerifications,
                recipient,
                chainIdHex,
                customScorerId,
              );

            const fee = await getEASFeeAmount(EAS_FEE_USD);
            const passportAttestation: PassportAttestation = {
              multiAttestationRequest,
              nonce: Number(nonce),
              fee: fee.toString(),
            };

            const domainSeparator = getAttestationDomainSeparator(chainIdHex);

            const signer = await getAttestationSignerForChain(chainIdHex);

            signer
              .signTypedData(
                domainSeparator,
                ATTESTER_TYPES,
                passportAttestation,
              )
              .then((signature): Promise<void> => {
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
          .catch((error): void => {
            const message = addErrorDetailsToMessage(
              "Error formatting onchain passport",
              error,
            );
            return void errorRes(res, message, 500);
          });
      })
      .catch((error): void => {
        const message = addErrorDetailsToMessage(
          "Error formatting onchain passport",
          error,
        );
        return void errorRes(res, message, 500);
      });
  } catch (error) {
    const message = addErrorDetailsToMessage(
      "Unexpected error when processing request",
      error,
    );
    return void errorRes(res, message, 500);
  }
});

// Expose entry point for getting eas payload for moving only the score on-chain (Score Attestations)
app.post("/api/v0.0.0/eas/score", async (req: Request, res: Response) => {
  try {
    const { recipient, nonce, chainIdHex, customScorerId } =
      req.body as EasRequestBody;
    if (!isChainIdHexValid(chainIdHex)) {
      return void errorRes(
        res,
        `No onchainInfo found for chainId ${chainIdHex}`,
        404,
      );
    }

    if (!(recipient && recipient.length === 42 && recipient.startsWith("0x")))
      return void errorRes(res, "Invalid recipient", 400);

    try {
      const multiAttestationRequest =
        await passportSchema.formatMultiAttestationRequestWithScore(
          recipient,
          chainIdHex,
          customScorerId,
        );

      const fee = await getEASFeeAmount(EAS_FEE_USD);
      const passportAttestation: PassportAttestation = {
        multiAttestationRequest,
        nonce: Number(nonce),
        fee: fee.toString(),
      };

      const domainSeparator = getAttestationDomainSeparator(chainIdHex);

      const signer = await getAttestationSignerForChain(chainIdHex);

      signer
        .signTypedData(domainSeparator, ATTESTER_TYPES, passportAttestation)
        .then((signature): void => {
          const { v, r, s } = Signature.from(signature);

          const payload: EasPayload = {
            passport: passportAttestation,
            signature: { v, r, s },
            invalidCredentials: [],
          };

          return void res.json(toJsonObject(payload));
        })
        .catch((): void => {
          return void errorRes(res, "Error signing score", 500);
        });
    } catch (error) {
      const message = addErrorDetailsToMessage(
        "Error formatting onchain score",
        error,
      );
      return void errorRes(res, message, 500);
    }
  } catch (error) {
    const message = addErrorDetailsToMessage(
      "Unexpected error when processing request",
      error,
    );
    return void errorRes(res, message, 500);
  }
});

// procedure endpoints
app.use("/procedure", procedureRouter);

app.use(
  "/static",
  express.static(
    path.join(path.dirname(fileURLToPath(import.meta.url)), "static"),
  ),
);
