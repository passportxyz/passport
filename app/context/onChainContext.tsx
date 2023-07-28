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

export type OnChainProviderType = {
  providerName: PROVIDER_ID;
  credentialHash: string;
  expirationDate: Date;
  issuanceDate: Date;
};

export interface OnChainContextState {
  onChainProviders: OnChainProviderMap;
  activeChainProviders: OnChainProviderType[];
  onChainScore: number;
  readOnChainData: () => Promise<void>;
}

const startingState: OnChainContextState = {
  onChainProviders: {},
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
        const passportAttestationData = await getAttestationData(wallet, address);

        if (!passportAttestationData) {
          return;
        }

        const { onChainProviderInfo, hashes, issuanceDates, expirationDates } = await decodeProviderInformation(
          passportAttestationData.passport
        );

        const onChainProviders: OnChainProviderType[] = onChainProviderInfo
          .sort((a, b) => a.providerNumber - b.providerNumber)
          .map((providerInfo, index) => ({
            providerName: providerInfo.providerName,
            credentialHash: `v0.0.0:${Buffer.from(hashes[index].slice(2), "hex").toString("base64")}`,
            expirationDate: new Date(expirationDates[index].toNumber() * 1000),
            issuanceDate: new Date(issuanceDates[index].toNumber() * 1000),
          }));
        const chainId = wallet.chains[0].id;
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
    readOnChainData();
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
