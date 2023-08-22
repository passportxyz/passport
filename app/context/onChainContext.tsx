// --- React Methods
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

import { datadogLogs } from "@datadog/browser-logs";
import { datadogRum } from "@datadog/browser-rum";
import { UserContext } from "./userContext";
import onchainInfo from "../../deployments/onchainInfo.json";

import { PROVIDER_ID } from "@gitcoin/passport-types";

import { decodeProviderInformation, decodeScoreAttestation, getAttestationData } from "../utils/onChainStamps";
import { Attestation } from "@ethereum-attestation-service/eas-sdk";
import { useSetChain } from "@web3-onboard/react";

export interface OnChainProviderMap {
  [chainId: string]: OnChainProviderType[];
}

export interface OnChainLastUpdates {
  [chainId: string]: Date;
}

export interface OnChainScores {
  [chainId: string]: number;
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
  onChainScores: OnChainScores;
  readOnChainData: () => Promise<void>;
}

const startingState: OnChainContextState = {
  onChainProviders: {},
  onChainLastUpdates: {},
  activeChainProviders: [],
  onChainScores: {},
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
  const [onChainScores, setOnChainScores] = useState<OnChainScores>({});
  const [onChainLastUpdates, setOnChainLastUpdates] = useState<OnChainLastUpdates>({});
  const [{ connectedChain }] = useSetChain();

  const savePassportLastUpdated = (attestation: Attestation, chainId: string) => {
    const lastUpdated = new Date(Number(BigInt(attestation.time.toString())) * 1000);
    setOnChainLastUpdates((prevState) => ({
      ...prevState,
      [chainId]: lastUpdated,
    }));
  };

  const readOnChainData = useCallback(async () => {
    if (wallet && address) {
      try {
        if (!process.env.NEXT_PUBLIC_ACTIVE_ON_CHAIN_PASSPORT_CHAINIDS) {
          datadogLogs.logger.error("No active onchain passport chain ids set");
          datadogRum.addError("No active onchain passport chain ids set");
          return;
        }
        const activeChainIds = JSON.parse(process.env.NEXT_PUBLIC_ACTIVE_ON_CHAIN_PASSPORT_CHAINIDS);
        await Promise.all(
          activeChainIds.map(async (chainId: string) => {
            const passportAttestationData = await getAttestationData(address, chainId as keyof typeof onchainInfo);
            if (!passportAttestationData) {
              return;
            }

            const { onChainProviderInfo, hashes, issuanceDates, expirationDates } = await decodeProviderInformation(
              passportAttestationData.passport
            );

            savePassportLastUpdated(passportAttestationData.passport, chainId);

            const onChainProviders: OnChainProviderType[] = onChainProviderInfo
              .sort((a, b) => a.providerNumber - b.providerNumber)
              .map((providerInfo, index) => ({
                providerName: providerInfo.providerName,
                credentialHash: `v0.0.0:${Buffer.from(hashes[index].slice(2), "hex").toString("base64")}`,
                expirationDate: new Date(expirationDates[index].toNumber() * 1000),
                issuanceDate: new Date(issuanceDates[index].toNumber() * 1000),
              }));

            // Set the onchain status
            setOnChainProviders((prevState) => ({
              ...prevState,
              [chainId]: onChainProviders,
            }));

            if (chainId === connectedChain?.id) setActiveChainProviders(onChainProviders);

            const score = await decodeScoreAttestation(passportAttestationData.score);
            setOnChainScores((prevState) => ({
              ...prevState,
              [chainId]: score,
            }));
          })
        );
      } catch (e: any) {
        datadogLogs.logger.error("Failed to check onchain status", e);
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
    onChainLastUpdates,
    readOnChainData,
    onChainScores,
  };

  return <OnChainContext.Provider value={providerProps}>{children}</OnChainContext.Provider>;
};
