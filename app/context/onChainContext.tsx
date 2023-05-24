// --- React Methods
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

import { graphql_fetch } from "../utils/helpers";
import { ethers } from "ethers";
import { datadogLogs } from "@datadog/browser-logs";
import { datadogRum } from "@datadog/browser-rum";
import { UserContext } from "./userContext";

type OnChainProviderType = {
  providerHash: string;
  credentialHash: string;
};

export interface OnChainContextState {
  onChainProviders: OnChainProviderType[];
  refreshOnChainProviders: () => Promise<void>;
}

const startingState: OnChainContextState = {
  onChainProviders: [],
  refreshOnChainProviders: async (): Promise<void> => {},
};

// create our app context
export const OnChainContext = createContext(startingState);

export const OnChainContextProvider = ({ children }: { children: any }) => {
  const { address } = useContext(UserContext);
  const [onChainProviders, setOnChainProviders] = useState<OnChainProviderType[]>([]);

  const fetchOnChainStatus = useCallback(async () => {
    try {
      if (!process.env.NEXT_PUBLIC_EAS_INDEXER_URL) {
        throw new Error("NEXT_PUBLIC_EAS_INDEXER_URL is not defined");
      }

      // Get the attestations for the given user
      const res = await graphql_fetch(
        new URL(process.env.NEXT_PUBLIC_EAS_INDEXER_URL),
        `
        query GetAttestations($where: AttestationWhereInput) {
          attestations(where: $where) {
            decodedDataJson
          }
        }
      `,
        {
          where: {
            recipient: { equals: ethers.getAddress(address!) },
            attester: { equals: process.env.NEXT_PUBLIC_GITCOIN_ATTESTER_CONTRACT_ADDRESS },
            schemaId: { equals: process.env.NEXT_PUBLIC_GITCOIN_VC_SCHEMA_UUID },
          },
        }
      );

      const attestations = res.data.attestations;

      let providers: OnChainProviderType[] = [];

      // Extract all providers
      attestations.forEach((attestation: any) => {
        const { decodedDataJson } = attestation;
        const decodedData = JSON.parse(decodedDataJson);
        const providerData = decodedData.find((data: any) => data.name === "provider");
        const hashData = decodedData.find((data: any) => data.name === "hash");

        const hexValue = hashData.value.value.slice(2); // Remove the "0x" prefix
        const base64EncodedBytes = Buffer.from(hexValue, "hex").toString("base64");

        if (providerData) {
          providers.push({
            providerHash: providerData.value.value,
            credentialHash: `v0.0.0:${base64EncodedBytes}`,
          });
        }
      });

      // Set the on-chain status
      setOnChainProviders(providers);
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
