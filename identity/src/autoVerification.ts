// ---- Web3 packages
import { isAddress } from "ethers";

// ---- Types
import { Response } from "express";
import {
  PROVIDER_ID,
  ValidResponseBody,
  SignatureType,
  VerifiableCredential,
  VerifiedPayload,
} from "@gitcoin/passport-types";

// All provider exports from platforms
import { platforms } from "@gitcoin/passport-platforms";
import { verifyProvidersAndIssueCredentials, VerificationError, addErrorDetailsToMessage } from "./verification";

const providerTypePlatformMap = Object.entries(platforms).reduce(
  (acc, [platformName, { PlatformDetails, ProviderConfig }]) => {
    ProviderConfig.forEach(({ platformGroup, providers }) => {
      providers.forEach(({ name }) => {
        acc[name] = platformName;
      });
    });
    return acc;
  },
  {} as { [k: string]: string }
);

export type AutoVerificationFields = {
  address: string;
  scorerId: string;
};

export type AutoVerificationResponseBodyType = {
  score: string;
  threshold: string;
};

const getEvmProvidersByPlatform = ({ scorerId }: { scorerId: string }): PROVIDER_ID[][] => {
  const evmPlatforms = Object.values(platforms).filter(({ PlatformDetails }) => PlatformDetails.isEVM);

  // TODO we should use the scorerId to check for any EVM stamps particular to a community, and include those here
  scorerId;

  return evmPlatforms.map(({ ProviderConfig }) =>
    ProviderConfig.reduce((acc, platformGroupSpec) => {
      return acc.concat(platformGroupSpec.providers.map(({ name }) => name));
    }, [] as PROVIDER_ID[])
  );
};

export const autoVerifyStamps = async ({
  address,
  scorerId,
}: AutoVerificationFields): Promise<VerifiableCredential[]> => {
  try {
    const evmProvidersByPlatform = getEvmProvidersByPlatform({ scorerId });

    if (!isAddress(address)) {
      throw new VerificationError("Invalid address", 400);
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
  } catch (error) {
    // TODO: check if error is of a common type used in platforms and evtl. rethrow it
    const message = addErrorDetailsToMessage("Unexpected error when processing request", error);
    throw new VerificationError(message, 500);
  }
};
