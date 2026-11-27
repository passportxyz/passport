import { isAddress } from "ethers";

// ---- Types
import {
  PROVIDER_ID,
  ValidResponseBody,
  SignatureType,
  VerifiableCredential,
  CredentialResponseBody,
} from "@gitcoin/passport-types";

import { platforms } from "@gitcoin/passport-platforms";
import { verifyProvidersAndIssueCredentials } from "./verification.js";
import { ApiError } from "./serverUtils/apiError.js";
import type { ProviderTimings } from "./verification.js";

export type CredentialError = {
  provider: string;
  error: string;
  code?: number;
};

export type AutoVerificationResult = {
  credentials: VerifiableCredential[];
  credentialErrors: CredentialError[];
  timings?: ProviderTimings;
};

export type AutoVerificationFields = {
  address: string;
  scorerId: string;
  credentialIds?: string[];
  customEvmCredentialIds?: string[];
};

export type AutoVerificationResponseBodyType = {
  score: string;
  threshold: string;
};

export const getEvmProvidersByPlatform = ({
  onlyCredentialIds,
  customEvmCredentialIds,
}: {
  onlyCredentialIds?: string[];
  customEvmCredentialIds?: string[];
}): PROVIDER_ID[][] => {
  const evmPlatforms = Object.values(platforms).filter(({ PlatformDetails }) => PlatformDetails.isEVM);

  const result = evmPlatforms.map(({ ProviderConfig }) =>
    ProviderConfig.reduce((acc, platformGroupSpec) => {
      const providers = platformGroupSpec.providers.map(({ name }) => name);

      const filteredProviders = !onlyCredentialIds
        ? providers
        : providers.filter((provider) => onlyCredentialIds.includes(provider));
      if (filteredProviders.length > 0) {
        return acc.concat(filteredProviders);
      }

      return acc;
    }, [] as PROVIDER_ID[])
  );

  // Append custom EVM credentials as additional platform groups
  if (customEvmCredentialIds?.length) {
    const filtered = onlyCredentialIds
      ? customEvmCredentialIds.filter((id) => onlyCredentialIds.includes(id))
      : customEvmCredentialIds;
    if (filtered.length > 0) {
      result.push(filtered as PROVIDER_ID[]);
    }
  }

  return result;
};

export const autoVerifyStamps = async ({
  address,
  scorerId,
  credentialIds,
  customEvmCredentialIds,
}: AutoVerificationFields): Promise<AutoVerificationResult> => {
  const evmProvidersByPlatform = getEvmProvidersByPlatform({
    onlyCredentialIds: credentialIds,
    customEvmCredentialIds,
  });

  if (!isAddress(address)) {
    throw new ApiError("Invalid address", "400_BAD_REQUEST");
  }

  const credentialsInfo = {
    address,
    type: "EVMBulkVerify",
    // types: evmProviders,
    version: "0.0.0",
    signatureType: "EIP712" as SignatureType,
  };

  const { credentials: results, timings } = await verifyProvidersAndIssueCredentials(
    evmProvidersByPlatform,
    address,
    credentialsInfo
  );

  const credentials: VerifiableCredential[] = [];
  const credentialErrors: CredentialError[] = [];

  // Flatten the provider list to match the results structure
  const flatProviderList = evmProvidersByPlatform.flat();

  // Process each result and separate successful credentials from errors
  results.forEach((credentialResponse, index) => {
    if ("credential" in credentialResponse && credentialResponse.credential) {
      credentials.push(credentialResponse.credential);
    } else if ("error" in credentialResponse && credentialResponse.error) {
      // Map index directly to the flattened provider list
      const providerName = flatProviderList[index] || "unknown";

      credentialErrors.push({
        provider: providerName,
        error: credentialResponse.error,
        code: credentialResponse.code,
      });
    }
  });

  return {
    credentials,
    credentialErrors,
    timings,
  };
};
