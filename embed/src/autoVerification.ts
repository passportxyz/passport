// ---- Web3 packages
import { isAddress } from "ethers";

// ---- Types
import { Response, Request } from "express";
import {
  PROVIDER_ID,
  ValidResponseBody,
  SignatureType,
  VerifiableCredential,
  RequestPayload,
  CredentialResponseBody,
  VerifiedPayload,
  ProviderContext,
} from "@gitcoin/passport-types";
import { ParamsDictionary } from "express-serve-static-core";

// All provider exports from platforms
import { platforms, providers, handleAxiosError } from "@gitcoin/passport-platforms";
import { issueHashedCredential } from "@gitcoin/passport-identity";

import * as DIDKit from "@spruceid/didkit-wasm-node";

import axios from "axios";

const apiKey = process.env.SCORER_API_KEY;
const key = process.env.IAM_JWK;
const __issuer = DIDKit.keyToDID("key", key);
const eip712Key = process.env.IAM_JWK_EIP712;
const __eip712Issuer = DIDKit.keyToDID("ethr", eip712Key);

const validIssuers = new Set([__issuer, __eip712Issuer]);

export function getEd25519IssuerKey(): string {
  return key;
}

export function getEd25519Issuer(): string {
  return __issuer;
}

export function getEip712IssuerKey(): string {
  return eip712Key;
}

export function getEip712Issuer(): string {
  return __eip712Issuer;
}

export function getIssuerKey(signatureType: string): string {
  return signatureType === "EIP712" ? eip712Key : key;
}

export function hasValidIssuer(issuer: string): boolean {
  return validIssuers.has(issuer);
}

export class IAMError extends Error {
  constructor(public message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

// return a JSON error response with a 400 status
export const errorRes = (res: Response, error: string | object, errorCode: number): Response =>
  res.status(errorCode).json({ error });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const addErrorDetailsToMessage = (message: string, error: any): string => {
  if (error instanceof IAMError || error instanceof Error) {
    message += `, ${error.name}: ${error.message}`;
  } else if (typeof error === "string") {
    message += `, ${error}`;
  }
  return message;
};

export class ApiError extends Error {
  constructor(
    public message: string,
    public code: number
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class UnexpectedApiError extends ApiError {
  constructor(message: string) {
    super(message, 500);
    this.name = this.constructor.name;
  }
}

type VerifyTypeResult = {
  verifyResult: VerifiedPayload;
  type: string;
  error?: string;
  code?: number;
};

export type PassportProviderPoints = {
  score: string;
  dedup: boolean;
  expiration_date: string;
};

export type PassportScore = {
  address: string;
  score: string;
  passing_score: boolean;
  last_score_timestamp: string;
  expiration_timestamp: string;
  threshold: string;
  error: string;
  stamps: Record<string, PassportProviderPoints>;
};

export async function verifyTypes(
  typesByPlatform: PROVIDER_ID[][],
  payload: RequestPayload
): Promise<VerifyTypeResult[]> {
  // define a context to be shared between providers in the verify request
  // this is intended as a temporary storage for providers to share data
  const context: ProviderContext = {};
  const results: VerifyTypeResult[] = [];

  await Promise.all(
    // Run all platforms in parallel
    typesByPlatform.map(async (platformTypes) => {
      // Iterate over the types within a platform in series
      // This enables providers within a platform to reliably share context
      for (const _type of platformTypes) {
        let type = _type as string;
        let verifyResult: VerifiedPayload = { valid: false };
        let code, error;

        const realType = type;
        if (type.startsWith("AllowList")) {
          payload.proofs = {
            ...payload.proofs,
            allowList: type.split("#")[1],
          };
          type = "AllowList";
        } else if (type.startsWith("DeveloperList")) {
          // Here we handle the custom DeveloperList stamps
          const [__type, conditionName, conditionHash, ..._rest] = type.split("#");
          payload.proofs = {
            ...payload.proofs,
            conditionName,
            conditionHash,
          };
          type = "DeveloperList";
        }

        try {
          // verify the payload against the selected Identity Provider
          verifyResult = await providers.verify(type, payload, context);
          if (!verifyResult.valid) {
            code = 403;
            // TODO to be changed to just verifyResult.errors when all providers are updated
            const resultErrors = verifyResult.errors;
            error = resultErrors?.join(", ")?.substring(0, 1000) || "Unable to verify provider";
            if (error.includes(`Request timeout while verifying ${type}.`)) {
              console.log(`Request timeout while verifying ${type}`);
              // If a request times out exit loop and return results so additional requests are not made
              break;
            }
          }
          if (type === "AllowList") {
            type = `AllowList#${verifyResult.record.allowList}`;
          } else {
            type = realType;
          }
        } catch (e) {
          error = "Unable to verify provider";
          code = 400;
        }

        results.push({ verifyResult, type, code, error });
      }
    })
  );

  return results;
}

// return response for given payload
export const issueCredentials = async (
  typesByPlatform: PROVIDER_ID[][],
  address: string,
  payload: RequestPayload
): Promise<CredentialResponseBody[]> => {
  // if the payload includes an additional signer, use that to issue credential.
  if (payload.signer) {
    // We can assume that the signer is a valid address because the challenge was verified within the /verify endpoint
    payload.address = payload.signer.address;
  }

  const results = await verifyTypes(typesByPlatform, payload);

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

          const currentKey = getIssuerKey(payload.signatureType);

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

export type AutoVerificationRequestBodyType = {
  address: string;
  scorerId: string;
  credentialIds?: [];
};

type AutoVerificationFields = AutoVerificationRequestBodyType;

export type AutoVerificationResponseBodyType = {
  score: string;
  threshold: string;
};

export const autoVerificationHandler = async (
  req: Request<ParamsDictionary, AutoVerificationResponseBodyType, AutoVerificationRequestBodyType>,
  res: Response
): Promise<void> => {
  try {
    const { address, scorerId, credentialIds } = req.body;

    if (!isAddress(address)) {
      return void errorRes(res, "Invalid address", 400);
    }

    const stamps = await getPassingEvmStamps({ address, scorerId, credentialIds });

    const score = await addStampsAndGetScore({ address, scorerId, stamps });

    // TODO should we issue a score VC?
    return void res.json(score);
  } catch (error) {
    if (error instanceof ApiError || error instanceof UnexpectedApiError) {
      return void errorRes(res, error.message, error.code);
    }
    const message = addErrorDetailsToMessage("Unexpected error when processing request", error);
    return void errorRes(res, message, 500);
  }
};

const getEvmProvidersByPlatform = ({
  scorerId,
  onlyCredentialIds,
}: {
  scorerId: string;
  onlyCredentialIds?: string[];
}): PROVIDER_ID[][] => {
  const evmPlatforms = Object.values(platforms).filter(({ PlatformDetails }) => PlatformDetails.isEVM);

  // TODO we should use the scorerId to check for any EVM stamps particular to a community, and include those here
  scorerId;

  return evmPlatforms
    .map(({ ProviderConfig }) =>
      ProviderConfig.reduce((acc, platformGroupSpec) => {
        return acc.concat(platformGroupSpec.providers.map(({ name }) => name));
      }, [] as PROVIDER_ID[]).filter((provider) => !onlyCredentialIds || onlyCredentialIds.includes(provider))
    )
    .filter((platformProviders) => platformProviders.length > 0);
};

export const getPassingEvmStamps = async ({
  address,
  scorerId,
  credentialIds,
}: AutoVerificationFields): Promise<VerifiableCredential[]> => {
  const evmProvidersByPlatform = getEvmProvidersByPlatform({ scorerId, onlyCredentialIds: credentialIds });

  const credentialsInfo = {
    address,
    type: "EVMBulkVerify",
    // types: evmProviders,
    version: "0.0.0",
    signatureType: "EIP712" as SignatureType,
  };

  const results = await issueCredentials(evmProvidersByPlatform, address, credentialsInfo);

  const ret = results
    .flat()
    .filter(
      (credentialResponse): credentialResponse is ValidResponseBody =>
        (credentialResponse as ValidResponseBody).credential !== undefined
    )
    .map(({ credential }) => credential);
  return ret;
};

export const addStampsAndGetScore = async ({
  address,
  scorerId,
  stamps,
}: Omit<AutoVerificationFields, "credentialIds"> & { stamps: VerifiableCredential[] }): Promise<PassportScore> => {
  try {
    const scorerResponse: {
      data?: {
        score?: PassportScore;
      };
    } = await axios.post(
      `${process.env.SCORER_ENDPOINT}/embed/stamps/${address}`,
      {
        stamps,
        scorer_id: scorerId,
      },
      {
        headers: {
          Authorization: apiKey,
        },
      }
    );

    return scorerResponse.data?.score;
  } catch (error) {
    handleAxiosError(error, "Scorer Embed API", UnexpectedApiError, [apiKey]);
  }
};
