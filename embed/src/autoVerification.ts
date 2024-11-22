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
import { platforms } from "@gitcoin/passport-platforms";
import { issueHashedCredential } from "@gitcoin/passport-identity";
import { providers } from "@gitcoin/passport-platforms";

import * as DIDKit from "@spruceid/didkit-wasm-node";

import axios from "axios";

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

type VerifyTypeResult = {
  verifyResult: VerifiedPayload;
  type: string;
  error?: string;
  code?: number;
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

export async function verifyTypes(types: string[], payload: RequestPayload): Promise<VerifyTypeResult[]> {
  // define a context to be shared between providers in the verify request
  // this is intended as a temporary storage for providers to share data
  const context: ProviderContext = {};
  const results: VerifyTypeResult[] = [];

  await Promise.all(
    // Run all platforms in parallel
    groupProviderTypesByPlatform(types).map(async (platformTypes) => {
      // Iterate over the types within a platform in series
      // This enables providers within a platform to reliably share context
      for (let type of platformTypes) {
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
          const [_type, conditionName, conditionHash, ..._rest] = type.split("#");
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

export const checkConditionsAndIssueCredentials = async (
  payload: RequestPayload,
  address: string
): Promise<CredentialResponseBody[] | CredentialResponseBody> => {
  const singleType = !payload.types?.length;
  const types = (!singleType ? payload.types : [payload.type]).filter((type) => type);

  // Validate requirements and issue credentials
  if (payload && payload.type) {
    const responses = await issueCredentials(types, address, payload);

    if (singleType) {
      const response = responses[0];
      if ("error" in response && response.code && response.error) {
        throw new ApiError(response.error, response.code);
      }
      return response;
    }
    return responses;
  }

  throw new ApiError("Invalid payload", 400);
};

type AutoVerificationRequestBodyType = {
  address: string;
  scorerId: string;
};

type AutoVerificationFields = AutoVerificationRequestBodyType;

type AutoVerificationResponseBodyType = {
  score: string;
  threshold: string;
};

const apiKey = process.env.SCORER_API_KEY;

export const autoVerificationHandler = async (
  req: Request<ParamsDictionary, AutoVerificationResponseBodyType, AutoVerificationRequestBodyType>,
  res: Response
): Promise<void> => {
  try {
    const { address, scorerId } = req.body;

    if (!isAddress(address)) {
      return void errorRes(res, "Invalid address", 400);
    }

    const stamps = await getPassingEvmStamps({ address, scorerId });

    const { score, threshold } = await addStampsAndGetScore({ address, scorerId, stamps });

    // TODO should we issue a score VC?

    return void res.json({ score, threshold });
  } catch (error) {
    if (error instanceof ApiError) {
      return void errorRes(res, error.message, error.code);
    }
    const message = addErrorDetailsToMessage("Unexpected error when processing request", error);
    return void errorRes(res, message, 500);
  }
};

const getEvmProviders = ({ scorerId }: { scorerId: string }): PROVIDER_ID[] => {
  const evmPlatforms = Object.values(platforms).filter(({ PlatformDetails }) => PlatformDetails.isEVM);

  // TODO we should use the scorerId to check for any EVM stamps particular to a community, and include those here
  scorerId;

  return evmPlatforms
    .map(({ ProviderConfig }) => ProviderConfig.map(({ providers }) => providers.map(({ name }) => name)))
    .flat(2);
};

const getPassingEvmStamps = async ({ address, scorerId }: AutoVerificationFields): Promise<VerifiableCredential[]> => {
  const evmProviders = getEvmProviders({ scorerId });

  const credentialsInfo = {
    address,
    type: "EVMBulkVerify",
    types: evmProviders,
    version: "0.0.0",
    signatureType: "EIP712" as SignatureType,
  };

  const result = await checkConditionsAndIssueCredentials(credentialsInfo, address);

  return (result ? [result] : [])
    .flat()
    .filter(
      (credentialResponse): credentialResponse is ValidResponseBody =>
        (credentialResponse as ValidResponseBody).credential !== undefined
    )
    .map(({ credential }) => credential);
};

const addStampsAndGetScore = async ({
  address,
  scorerId,
  stamps,
}: AutoVerificationFields & { stamps: VerifiableCredential[] }): Promise<{
  score: string;
  threshold: string;
}> => {
  const scorerResponse: {
    data?: {
      score?: {
        score?: string;
        evidence?: {
          rawScore?: string | number;
          threshold?: string | number;
        };
      };
    };
  } = await axios.post(
    `${process.env.SCORER_ENDPOINT}/internal/stamps/${address}`,
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

  const scoreData = scorerResponse.data?.score || {};

  const score = String(scoreData.evidence?.rawScore || scoreData.score);
  const threshold = String(scoreData.evidence?.threshold || 20);

  return { score, threshold };
};
