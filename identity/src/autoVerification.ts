import { isAddress } from "ethers";

// ---- Types
import { PROVIDER_ID, ValidResponseBody, SignatureType, VerifiableCredential } from "@gitcoin/passport-types";

import { platforms } from "@gitcoin/passport-platforms";
import { verifyProvidersAndIssueCredentials } from "./verification.js";
import { ApiError } from "./serverUtils/apiError.js";

export type AutoVerificationFields = {
  address: string;
  scorerId: string;
  credentialIds?: string[];
};

export type AutoVerificationResponseBodyType = {
  score: string;
  threshold: string;
};

export const getEvmProvidersByPlatform = ({
  scorerId,
  onlyCredentialIds,
}: {
  scorerId: string;
  onlyCredentialIds?: string[];
}): PROVIDER_ID[][] => {
  const evmPlatforms = Object.values(platforms).filter(({ PlatformDetails }) => PlatformDetails.isEVM);

  // TODO we should use the scorerId to check for any EVM stamps particular to a community, and include those here
  const _ = scorerId;

  return evmPlatforms.map(({ ProviderConfig }) =>
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
};

export const autoVerifyStamps = async ({
  address,
  scorerId,
  credentialIds,
}: AutoVerificationFields): Promise<VerifiableCredential[]> => {
  const evmProvidersByPlatform = getEvmProvidersByPlatform({
    scorerId,
    onlyCredentialIds: credentialIds,
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

  const results = await verifyProvidersAndIssueCredentials(evmProvidersByPlatform, address, credentialsInfo);

  const ret = results
    .flat()
    .filter(
      (credentialResponse): credentialResponse is ValidResponseBody =>
        (credentialResponse as ValidResponseBody).credential !== undefined
    )
    .map(({ credential }) => credential);
  return ret;
};
