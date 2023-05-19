// --- React Methods
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

import { PROVIDER_ID } from "@gitcoin/passport-types";
import { graphql_fetch } from "../utils/helpers";
import { ethers } from "ethers";
import { datadogLogs } from "@datadog/browser-logs";
import { datadogRum } from "@datadog/browser-rum";
import { UserContext } from "./userContext";
import { STAMP_PROVIDERS } from "../config/providers";

export type OnChainProviderType = {
  isOnChain: boolean;
};

export type OnChainProvidersType = {
  [key in PROVIDER_ID]?: OnChainProviderType;
};

export interface OnChainContextState {
  onChainProviders: OnChainProvidersType;
  refreshOnChainProviders: () => Promise<void>;
}

const providerNames = Object.values(STAMP_PROVIDERS).flatMap((providerGroups) =>
  providerGroups.flatMap((group) => group.providers.map((provider) => provider.name))
);

const allProviders: OnChainProvidersType = {};

for (const providerName of providerNames) {
  allProviders[providerName as PROVIDER_ID] = { isOnChain: false };
}

const startingState: OnChainContextState = {
  onChainProviders: allProviders,
  refreshOnChainProviders: async (): Promise<void> => {},
};

// create our app context
export const OnChainContext = createContext(startingState);

export const OnChainContextProvider = ({ children }: { children: any }) => {
  const { address } = useContext(UserContext);
  const [onChainProviders, setOnChainProviders] = useState<OnChainProvidersType>(allProviders);

  const sortAttestationsByTimeCreated = (attestations: any[]) => {
    return attestations.sort((a: any, b: any) => b.timeCreated - a.timeCreated);
  };

  // check on-chain status by checking if attestations exist for at least one provider of the stamp
  const fetchOnChainStatus = useCallback(async () => {
    try {
      if (!process.env.NEXT_PUBLIC_EAS_INDEXER_URL) {
        throw new Error("NEXT_PUBLIC_EAS_INDEXER_URL is not defined");
      }

      // Get the attestations for the given user
      const res = await graphql_fetch(
        new URL(process.env.NEXT_PUBLIC_EAS_INDEXER_URL),
        `
        query GetAttestations($recipient: StringFilter, $attester: StringFilter) {
          attestations(where: {
            recipient: $recipient,
            attester: $attester
          }) {
            decodedDataJson
            timeCreated
          }
        }
      `,
        {
          recipient: { equals: ethers.getAddress(address!) },
          attester: { equals: process.env.NEXT_PUBLIC_GITCOIN_ATTESTER_CONTRACT_ADDRESS },
        }
      );

      const attestations = res.data.attestations;

      // Sort the attestations by timeCreated in descending order
      const sortedAttestations = sortAttestationsByTimeCreated(attestations);

      // Find the latest timeCreated value
      const latestTimeCreated = sortedAttestations[0]?.timeCreated;

      // Extract all providers with the latest timeCreated value
      sortedAttestations.forEach((attestation: any) => {
        const { decodedDataJson, timeCreated } = attestation;
        const decodedData = JSON.parse(decodedDataJson);
        const providerData = decodedData.find((data: any) => data.name === "provider");
        if (providerData && timeCreated === latestTimeCreated) {
          const providerId = providerData.value.value as PROVIDER_ID;
          allProviders[providerId]!.isOnChain = true;
        }
      });

      // Set the on-chain status
      setOnChainProviders(allProviders);
    } catch (e: any) {
      datadogLogs.logger.error("Failed to check on-chain status", e);
      datadogRum.addError(e);
    }
  }, [address]);

  const refreshOnChainProviders = () => {
    return fetchOnChainStatus();
  };

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_FF_CHAIN_SYNC === "on") {
      fetchOnChainStatus();
    }
  }, [fetchOnChainStatus]);

  // use props as a way to pass configuration values
  const providerProps = {
    onChainProviders,
    refreshOnChainProviders,
  };

  return <OnChainContext.Provider value={providerProps}>{children}</OnChainContext.Provider>;
};
