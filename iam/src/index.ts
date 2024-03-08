// import { EnsProvider } from './providers/ens';
// Should this file be an app factory? If it was, we could move the provider config to main.ts and test in isolation

// ---- Server
import express, { Request } from "express";
import { router as procedureRouter } from "@gitcoin/passport-platforms/procedure-router";
import { TypedDataDomain } from "@ethersproject/abstract-signer";

// ---- Production plugins
import cors from "cors";

// ---- Web3 packages
import { utils, ethers } from "ethers";

// ---- Types
import { Response } from "express";
import {
  RequestPayload,
  ChallengeRequestBody,
  VerifyRequestBody,
  CredentialResponseBody,
  ProviderContext,
  CheckRequestBody,
  EasPayload,
  PassportAttestation,
  EasRequestBody,
  VerifiedPayload,
  VerifiableCredential,
} from "@gitcoin/passport-types";
import onchainInfo from "../../deployments/onchainInfo.json" assert { type: "json" };

import { getChallenge, verifyChallengeAndGetAddress } from "./utils/challenge.js";
import { getEASFeeAmount } from "./utils/easFees.js";
import * as stampSchema from "./utils/easStampSchema.js";
import * as passportSchema from "./utils/easPassportSchema.js";

// ---- Generate & Verify methods
import * as DIDKit from "@spruceid/didkit-wasm-node";
import {
  issueChallengeCredential,
  issueHashedCredential,
  verifyCredential,
  issueEip712Credential,
  stampCredentialDocument,
} from "@gitcoin/passport-identity";

// All provider exports from platforms
import { providers, platforms } from "@gitcoin/passport-platforms";

import path from "path";
import { fileURLToPath } from "url";
import { IAMError } from "./utils/scorerService.js";
import { VerifyDidChallengeBaseError } from "./utils/verifyDidChallenge.js";

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

if (configErrors.length > 0) {
  configErrors.forEach((error) => console.error(error)); // eslint-disable-line no-console
  throw new Error("Missing required configuration");
}

// get DID from key
const key = process.env.IAM_JWK;
const issuer = DIDKit.keyToDID("key", key);
const eip712Key = process.env.IAM_JWK_EIP712;
const eip712Issuer = DIDKit.keyToDID("ethr", eip712Key);

// export the current config
export const config: {
  key: string;
  issuer: string;
} = {
  key,
  issuer,
};

// Wallet to use for mainnets
// Only functional in production (set to same as testnet for non-production environments)
const productionAttestationSignerWallet = new ethers.Wallet(process.env.ATTESTATION_SIGNER_PRIVATE_KEY);
// Wallet to use for testnets
const testAttestationSignerWallet = new ethers.Wallet(process.env.TESTNET_ATTESTATION_SIGNER_PRIVATE_KEY);

const getAttestationSignerForChain = async (chainIdHex: keyof typeof onchainInfo): Promise<ethers.Wallet> => {
  const productionAttestationIssuerAddress = await productionAttestationSignerWallet.getAddress();
  const chainUsesProductionIssuer =
    onchainInfo[chainIdHex].issuer.address.toLowerCase() === productionAttestationIssuerAddress.toLowerCase();

  return chainUsesProductionIssuer ? productionAttestationSignerWallet : testAttestationSignerWallet;
};

export const getAttestationDomainSeparator = (chainIdHex: keyof typeof onchainInfo): TypedDataDomain => {
  const verifyingContract = onchainInfo[chainIdHex].GitcoinVerifier.address;
  const chainId = parseInt(chainIdHex, 16).toString();
  return {
    name: "GitcoinVerifier",
    version: "1",
    chainId,
    verifyingContract,
  };
};

const ATTESTER_TYPES = {
  AttestationRequestData: [
    { name: "recipient", type: "address" },
    { name: "expirationTime", type: "uint64" },
    { name: "revocable", type: "bool" },
    { name: "refUID", type: "bytes32" },
    { name: "data", type: "bytes" },
    { name: "value", type: "uint256" },
  ],
  MultiAttestationRequest: [
    { name: "schema", type: "bytes32" },
    { name: "data", type: "AttestationRequestData[]" },
  ],
  PassportAttestationRequest: [
    { name: "multiAttestationRequest", type: "MultiAttestationRequest[]" },
    { name: "nonce", type: "uint256" },
    { name: "fee", type: "uint256" },
  ],
};

const providerTypePlatformMap = Object.entries(platforms).reduce(
  (acc, [platformName, { providers }]) => {
    providers.forEach(({ type }) => {
      acc[type] = platformName;
    });
    return acc;
  },
  {} as { [k: string]: string }
);

function groupProviderTypesByPlatform(types: string[]): string[][] {
  return Object.values(
    types.reduce(
      (groupedProviders, type) => {
        const platform = providerTypePlatformMap[type] || "generic";

        if (!groupedProviders[platform]) groupedProviders[platform] = [];
        groupedProviders[platform].push(type);

        return groupedProviders;
      },
      {} as { [k: keyof typeof platforms]: string[] }
    )
  );
}

// create the app and run on port
export const app = express();

// parse JSON post bodies
app.use(express.json());

// set cors to accept calls from anywhere
app.use(cors());

// return a JSON error response with a 400 status
const errorRes = (res: Response, error: string, errorCode: number): Response => res.status(errorCode).json({ error });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const addErrorDetailsToMessage = (message: string, error: any): string => {
  if (error instanceof IAMError || error instanceof Error) {
    message += `, ${error.name}: ${error.message}`;
  } else if (typeof error === "string") {
    message += `, ${error}`;
  }
  return message;
};

// return response for given payload
const issueCredentials = async (
  types: string[],
  address: string,
  payload: RequestPayload
): Promise<CredentialResponseBody[]> => {
  // if the payload includes an additional signer, use that to issue credential.
  if (payload.signer) {
    // We can assume that the signer is a valid address because the challenge was verified within the /verify endpoint
    payload.address = payload.signer.address;
  }

  const results = await verifyTypes(types, payload);

  return await Promise.all(
    results.map(async ({ verifyResult, code: verifyCode, error: verifyError, type }) => {
      let code = verifyCode;
      let error = verifyError;
      let record, credential;

      try {
        // check if the request is valid against the selected Identity Provider
        if (verifyResult.valid === true) {
          // construct a set of Proofs to issue a credential against (this record will be used to generate a sha256 hash of any associated PII)
          record = {
            // type and address will always be known and can be obtained from the resultant credential
            type: verifyResult.record.pii ? `${type}#${verifyResult.record.pii}` : type,
            // version is defined by entry point
            version: "0.0.0",
            // extend/overwrite with record returned from the provider
            ...(verifyResult?.record || {}),
          };

          const currentKey = payload.signatureType === "EIP712" ? eip712Key : key;
          // generate a VC for the given payload
          ({ credential } = await issueHashedCredential(
            DIDKit,
            currentKey,
            address,
            record,
            verifyResult.expiresInSeconds,
            payload.signatureType
          ));
        }
      } catch {
        error = "Unable to produce a verifiable credential";
        code = 500;
      }

      return {
        record,
        credential,
        code,
        error,
      };
    })
  );
};

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

      const currentKey = payload.signatureType === "EIP712" ? eip712Key : key;
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

  verifyTypes(types, payload)
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

type VerifyTypeResult = {
  verifyResult: VerifiedPayload;
  type: string;
  error?: string;
  code?: number;
};

async function verifyTypes(types: string[], payload: RequestPayload): Promise<VerifyTypeResult[]> {
  // define a context to be shared between providers in the verify request
  // this is intended as a temporary storage for providers to share data
  const context: ProviderContext = {};
  const results: VerifyTypeResult[] = [];

  await Promise.all(
    // Run all platforms in parallel
    groupProviderTypesByPlatform(types).map(async (platformTypes) => {
      // Iterate over the types within a platform in series
      // This enables providers within a platform to reliably share context
      for (const type of platformTypes) {
        let verifyResult: VerifiedPayload = { valid: false };
        let code, error;

        try {
          // verify the payload against the selected Identity Provider
          verifyResult = await providers.verify(type, payload, context);
          if (!verifyResult.valid) {
            code = 403;
            // TODO to be changed to just verifyResult.errors when all providers are updated
            const resultErrors = verifyResult.errors;
            error = resultErrors?.join(", ")?.substring(0, 1000) || "Unable to verify provider";
          }
        } catch {
          error = "Unable to verify provider";
          code = 400;
        }

        results.push({ verifyResult, type, code, error });
      }
    })
  );

  return results;
}

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
      const currentIssuer = requestBody.payload.signatureType === "EIP712" ? eip712Issuer : issuer;

      if (verified && currentIssuer === challenge.issuer) {
        let address;
        try {
          address = await verifyChallengeAndGetAddress(requestBody);
        } catch (error) {
          if (error instanceof VerifyDidChallengeBaseError) {
            return void errorRes(res, `Invalid challenge signature: ${error.name}`, 401);
          }
          throw error;
        }
        payload.address = address;
        payload.issuer = issuer;
        // the signer should be the address outlined in the challenge credential - rebuild the id to check for a full match
        const isSigner = challenge.credentialSubject.id === `did:pkh:eip155:1:${address}`;
        const isType = challenge.credentialSubject.provider === `challenge-${payload.type}`;

        // if an additional signer is passed verify that message was signed by passed signer address
        if (payload.signer) {
          const additionalChallenge = payload.signer.challenge;

          const additionalSignerCredential = await verifyCredential(DIDKit, additionalChallenge);

          // pull the address so that its stored in a predictable (checksummed) format
          const verifiedAddress = utils.getAddress(
            utils.verifyMessage(additionalChallenge.credentialSubject.challenge, payload.signer.signature)
          );

          // if verifiedAddress does not equal the additional signer address throw an error because signature is invalid
          if (!additionalSignerCredential || verifiedAddress.toLowerCase() !== payload.signer.address.toLowerCase()) {
            return void errorRes(res, "Unable to verify payload signer", 401);
          }

          payload.signer.address = verifiedAddress;
        }

        const singleType = !payload.types?.length;
        const types = (!singleType ? payload.types : [payload.type]).filter((type) => type);

        // type is required because we need it to select the correct Identity Provider
        if (isSigner && isType && payload && payload.type) {
          const responses = await issueCredentials(types, address, payload);

          if (singleType) {
            const response = responses[0];
            if ("error" in response && response.code && response.error)
              return errorRes(res, response.error, response.code);
            else return res.json(response);
          } else {
            return res.json(responses);
          }
        }
      }

      // error response
      return void errorRes(res, "Unable to verify payload", 401);
    })
    .catch((error) => {
      let message = "Unable to verify payload";
      if (error instanceof Error) message += `: ${error.name}`;
      return void errorRes(res, message, 500);
    });
});

// expose convert entry point that will convert a V1 stamp to V2 stamp (Ed25519Signature2018 to EIP712)
app.post("/api/v0.0.0/convert", (req: Request, res: Response): void => {
  const credential: VerifiableCredential = req.body as VerifiableCredential;

  // Validate credential first
  verifyCredential(DIDKit, credential)
    .then((verified) => {
      // If the credential has been succesfully validateLocaleAndSetLanguage,
      // and if the issuer matches our expected issuer
      // then issue the new credential
      if (verified && issuer === credential.issuer) {
        DIDKit.keyToVerificationMethod("ethr", eip712Key)
          .then((_verificationMethod) => {
            const verificationMethod = _verificationMethod as string;
            // Extract the payload from the old VC
            const { id, hash, provider } = credential.credentialSubject;

            issueEip712Credential(
              DIDKit,
              eip712Key,
              { expiresAt: new Date(credential.expirationDate) },
              {
                credentialSubject: {
                  "@context": {
                    hash: "https://schema.org/Text",
                    provider: "https://schema.org/Text",
                  },
                  id,
                  hash,
                  provider,
                },
              },
              stampCredentialDocument(verificationMethod),
              ["https://w3id.org/vc/status-list/2021/v1"]
            )
              .then((newCredential) => {
                res.json(newCredential);
              })
              .catch((error) => {
                return void errorRes(res, addErrorDetailsToMessage("Failed to issue new credential", error), 500);
              });
          })
          .catch((error) => {
            return void errorRes(res, addErrorDetailsToMessage("Failed to create verification method", error), 500);
          });
      } else {
        return void errorRes(res, "Invalid credential.", 400);
      }
    })
    .catch((error) => {
      return void errorRes(
        res,
        addErrorDetailsToMessage("Unable to validate the provided credential, an unexpected error ocurred", error),
        500
      );
    });
});

// Expose entry point for getting eas payload for moving stamps on-chain (Stamp Attestations)
// This function will receive an array of stamps, validate them and return an array of eas payloads
app.post("/api/v0.0.0/eas", (req: Request, res: Response): void => {
  try {
    const { credentials, nonce, chainIdHex } = req.body as EasRequestBody;
    if (!Object.keys(onchainInfo).includes(chainIdHex)) {
      return void errorRes(res, `No onchainInfo found for chainId ${chainIdHex}`, 404);
    }
    const attestationChainIdHex = chainIdHex as keyof typeof onchainInfo;

    if (!credentials.length) return void errorRes(res, "No stamps provided", 400);

    const recipient = credentials[0].credentialSubject.id.split(":")[4];

    if (!(recipient && recipient.length === 42 && recipient.startsWith("0x")))
      return void errorRes(res, "Invalid recipient", 400);

    if (!credentials.every((credential) => credential.credentialSubject.id.split(":")[4] === recipient))
      return void errorRes(res, "Every credential's id must be equivalent", 400);

    Promise.all(
      credentials.map(async (credential) => {
        return {
          credential,
          verified: issuer === credential.issuer && (await verifyCredential(DIDKit, credential)),
        };
      })
    )
      .then(async (credentialVerifications) => {
        const invalidCredentials = credentialVerifications
          .filter(({ verified }) => !verified)
          .map(({ credential }) => credential);

        const multiAttestationRequest = await stampSchema.formatMultiAttestationRequest(
          credentialVerifications,
          recipient,
          attestationChainIdHex
        );

        const fee = await getEASFeeAmount(2);
        const passportAttestation: PassportAttestation = {
          multiAttestationRequest,
          nonce: Number(nonce),
          fee: fee.toString(),
        };

        const domainSeparator = getAttestationDomainSeparator(attestationChainIdHex);

        const signer = await getAttestationSignerForChain(attestationChainIdHex);

        signer
          ._signTypedData(domainSeparator, ATTESTER_TYPES, passportAttestation)
          .then((signature) => {
            const { v, r, s } = utils.splitSignature(signature);

            const payload: EasPayload = {
              passport: passportAttestation,
              signature: { v, r, s },
              invalidCredentials,
            };

            return void res.json(payload);
          })
          .catch(() => {
            return void errorRes(res, "Error signing passport", 500);
          });
      })
      .catch(() => {
        return void errorRes(res, "Error formatting onchain passport", 500);
      });
  } catch (error) {
    return void errorRes(res, String(error), 500);
  }
});

// Expose entry point for getting eas payload for moving stamps on-chain (Passport Attestations)
// This function will receive an array of stamps, validate them and return an array of eas payloads
app.post("/api/v0.0.0/eas/passport", (req: Request, res: Response): void => {
  try {
    const { recipient, credentials, nonce, chainIdHex } = req.body as EasRequestBody;
    if (!Object.keys(onchainInfo).includes(chainIdHex)) {
      return void errorRes(res, `No onchainInfo found for chainId ${chainIdHex}`, 404);
    }
    const attestationChainIdHex = chainIdHex as keyof typeof onchainInfo;

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

    Promise.all(
      credentials.map(async (credential) => {
        return {
          credential,
          verified:
            (issuer === credential.issuer || eip712Issuer === credential.issuer) &&
            (await verifyCredential(DIDKit, credential)),
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
          attestationChainIdHex
        );

        const fee = await getEASFeeAmount(2);
        const passportAttestation: PassportAttestation = {
          multiAttestationRequest,
          nonce: Number(nonce),
          fee: fee.toString(),
        };

        const domainSeparator = getAttestationDomainSeparator(attestationChainIdHex);

        const signer = await getAttestationSignerForChain(attestationChainIdHex);

        signer
          ._signTypedData(domainSeparator, ATTESTER_TYPES, passportAttestation)
          .then((signature) => {
            const { v, r, s } = utils.splitSignature(signature);

            const payload: EasPayload = {
              passport: passportAttestation,
              signature: { v, r, s },
              invalidCredentials,
            };

            return void res.json(payload);
          })
          .catch(() => {
            return void errorRes(res, "Error signing passport", 500);
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
    const { recipient, nonce, chainIdHex } = req.body as EasRequestBody;
    if (!Object.keys(onchainInfo).includes(chainIdHex)) {
      return void errorRes(res, `No onchainInfo found for chainId ${chainIdHex}`, 404);
    }
    const attestationChainIdHex = chainIdHex as keyof typeof onchainInfo;

    if (!(recipient && recipient.length === 42 && recipient.startsWith("0x")))
      return void errorRes(res, "Invalid recipient", 400);

    try {
      const multiAttestationRequest = await passportSchema.formatMultiAttestationRequestWithScore(
        recipient,
        attestationChainIdHex
      );

      const fee = await getEASFeeAmount(2);
      const passportAttestation: PassportAttestation = {
        multiAttestationRequest,
        nonce: Number(nonce),
        fee: fee.toString(),
      };

      const domainSeparator = getAttestationDomainSeparator(attestationChainIdHex);

      const signer = await getAttestationSignerForChain(attestationChainIdHex);

      signer
        ._signTypedData(domainSeparator, ATTESTER_TYPES, passportAttestation)
        .then((signature) => {
          const { v, r, s } = utils.splitSignature(signature);

          const payload: EasPayload = {
            passport: passportAttestation,
            signature: { v, r, s },
            invalidCredentials: [],
          };

          return void res.json(payload);
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
