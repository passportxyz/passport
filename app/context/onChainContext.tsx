// --- React Methods
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

import { datadogLogs } from "@datadog/browser-logs";
import { datadogRum } from "@datadog/browser-rum";
import { UserContext } from "./userContext";

import { PROVIDER_ID } from "@gitcoin/passport-types";

import { decodeProviderInformation, decodeScoreAttestation, getAttestationData } from "../utils/onChainStamps";

export interface OnChainProviderMap {
  [key: string]: OnChainProviderType[];
}

export interface OnChainLastUpdates {
  [key: string]: Date;
}

export type OnChainProviderType = {
  providerName: PROVIDER_ID;
  credentialHash: string;
  expirationDate: Date;
  issuanceDate: Date;
};

export interface OnChainContextState {
  onChainProviders: OnChainProviderMap;
  onChainLastUpdates: OnChainLastUpdates;
  activeChainProviders: OnChainProviderType[];
  onChainScore: number;
  readOnChainData: () => Promise<void>;
}

const startingState: OnChainContextState = {
  onChainProviders: {},
  onChainLastUpdates: {},
  activeChainProviders: [],
  onChainScore: 0,
  readOnChainData: async (): Promise<void> => {},
};

// create our app context
export const OnChainContext = createContext(startingState);

export type DecodedProviderInfo = {
  providerName: PROVIDER_ID;
  providerNumber: number;
};

export const OnChainContextProvider = ({ children }: { children: any }) => {
  const { address, wallet } = useContext(UserContext);
  const [onChainProviders, setOnChainProviders] = useState<OnChainProviderMap>({});
  const [activeChainProviders, setActiveChainProviders] = useState<OnChainProviderType[]>([]);
  const [onChainScore, setOnChainScore] = useState<number>(0);

  const readOnChainData = useCallback(async () => {
    if (wallet && address) {
      try {
        // TODO: When we support multiple chains will need to refactor this to account for all possible chains
        if (!process.env.NEXT_PUBLIC_ACTIVE_ON_CHAIN_PASSPORT_CHAINIDS) {
          datadogLogs.logger.error("No active on-chain passport chain ids set");
          datadogRum.addError("No active on-chain passport chain ids set");
          return;
        }
        const activeChainIds = JSON.parse(process.env.NEXT_PUBLIC_ACTIVE_ON_CHAIN_PASSPORT_CHAINIDS);
        const chainId = activeChainIds[0];

        const passportAttestationData = await getAttestationData(wallet, address, chainId);
        if (!passportAttestationData) {
          return;
        }

        const { onChainProviderInfo, hashes, issuanceDates, expirationDates } = await decodeProviderInformation(
          passportAttestationData.passport
        );

        savePassportLastUpdated(passportAttestationData, chainId);

        const onChainProviders: OnChainProviderType[] = onChainProviderInfo
          .sort((a, b) => a.providerNumber - b.providerNumber)
          .map((providerInfo, index) => ({
            providerName: providerInfo.providerName,
            credentialHash: `v0.0.0:${Buffer.from(hashes[index].slice(2), "hex").toString("base64")}`,
            expirationDate: new Date(expirationDates[index].toNumber() * 1000),
            issuanceDate: new Date(issuanceDates[index].toNumber() * 1000),
          }));

        // Set the on-chain status
        setOnChainProviders((prevState) => ({
          ...prevState,
          [chainId]: onChainProviders,
        }));

        setActiveChainProviders(onChainProviders);

        setOnChainScore(await decodeScoreAttestation(passportAttestationData.score));
      } catch (e: any) {
        datadogLogs.logger.error("Failed to check on-chain status", e);
        datadogRum.addError(e);
      }
    }
  }, [wallet, address]);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_FF_CHAIN_SYNC === "on") {
      readOnChainData();
    }
  }, [readOnChainData, wallet, address]);

  // use props as a way to pass configuration values
  const providerProps = {
    onChainProviders,
    activeChainProviders,
    readOnChainData,
    onChainScore,
  };

  return <OnChainContext.Provider value={providerProps}>{children}</OnChainContext.Provider>;
};
