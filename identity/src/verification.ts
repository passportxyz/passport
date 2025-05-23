// ---- Types
import { RequestPayload, CredentialResponseBody, VerifiedPayload, ProviderContext } from "@gitcoin/passport-types";

import { platforms, providers } from "@gitcoin/passport-platforms";
import { issueNullifiableCredential } from "./credentials.js";
import { checkCredentialBans } from "./bans.js";
import { getIssuerInfo } from "./issuers.js";
import * as logger from "./logger.js";

import * as DIDKit from "@spruceid/didkit-wasm-node";

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

export type VerifyTypeResult = {
  verifyResult: VerifiedPayload;
  type: string;
  error?: string;
  code?: number;
};

const providerTypePlatformMap = Object.entries(platforms).reduce(
  (acc, [platformName, { ProviderConfig }]) => {
    ProviderConfig.forEach(({ providers }) => {
      providers.forEach(({ name }) => {
        acc[name] = platformName;
      });
    });
    return acc;
  },
  {} as { [k: string]: string }
);

export function groupProviderTypesByPlatform(types: string[]): string[][] {
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

/**
 * Verify if the user identify by the request qualifies for the listed providers
 * @param providersByPlatform - nested map of providers, grouped by platform
 * @param payload - request payload
 * @returns An array of Verification results, with 1 element for each provider
 */
export async function verifyTypes(
  providersByPlatform: string[][],
  payload: RequestPayload
): Promise<VerifyTypeResult[]> {
  // define a context to be shared between providers in the verify request
  // this is intended as a temporary storage for providers to share data
  const context: ProviderContext = {};
  const results: VerifyTypeResult[] = [];

  await Promise.all(
    // Run all platforms in parallel
    providersByPlatform.map(async (platformProviders) => {
      // Iterate over the types within a platform in series
      // This enables providers within a platform to reliably share context
      for (const _type of platformProviders) {
        let type = _type;
        let verifyResult: VerifiedPayload = { valid: false };
        let code, error;
        const realType = type;

        const payloadForType = { ...payload, proofs: { ...payload.proofs } };
        if (type.startsWith("AllowList")) {
          payloadForType.proofs = {
            ...payload.proofs,
            allowList: type.split("#")[1],
          };
          type = "AllowList";
        } else if (type.startsWith("DeveloperList")) {
          // Here we handle the custom DeveloperList stamps
          const [__type, conditionName, conditionHash, ..._rest] = type.split("#");
          payloadForType.proofs = {
            ...payload.proofs,
            conditionName,
            conditionHash,
          };
          type = "DeveloperList";
        }

        try {
          // verify the payload against the selected Identity Provider
          verifyResult = await providers.verify(type, payloadForType, context);
          if (!verifyResult.valid) {
            code = 403;
            // TODO to be changed to just verifyResult.errors when all providers are updated
            const resultErrors = verifyResult.errors;
            error = resultErrors?.join(", ")?.substring(0, 1000) || "Unable to verify provider";
            if (error.includes(`Request timeout while verifying ${type}.`)) {
              logger.debug(`Request timeout while verifying ${type}`);
              // If a request times out exit loop and return results so additional requests are not made
              break;
            }
          }
          type = realType;
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

/**
 *
 * @param typesByPlatform List of provider types grouped by platform
 * @param address the address for which to claim stamps
 * @param payload the request payload
 * @returns An array of issued credentials
 *
 * This function will verify the request for all the providers listed in providersByPlatform and
 * return an credential for each verification that is successful or an error where this failed.
 *
 * Credentials are verified against existing bans in the scorer service.
 */
export const verifyProvidersAndIssueCredentials = async (
  providersByPlatform: string[][],
  address: string,
  payload: RequestPayload
): Promise<CredentialResponseBody[]> => {
  const results = await verifyTypes(providersByPlatform, payload);
  const credentials = await Promise.all(
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

          const { issuer, nullifierGenerators } = getIssuerInfo();

          // generate a VC for the given payload
          ({ credential } = await issueNullifiableCredential({
            DIDKit,
            issuerKey: issuer.key,
            address,
            record,
            expiresInSeconds: verifyResult.expiresInSeconds,
            signatureType: payload.signatureType,
            nullifierGenerators,
          }));
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

  const credentialsAfterBan = await checkCredentialBans(credentials);
  return credentialsAfterBan;
};
