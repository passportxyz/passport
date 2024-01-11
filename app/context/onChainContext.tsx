// --- React Methods
import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";

import { datadogLogs } from "@datadog/browser-logs";
import { datadogRum } from "@datadog/browser-rum";
import { useWalletStore } from "./walletStore";
import onchainInfo from "../../deployments/onchainInfo.json";
import { chains } from "../utils/chains";

import { PROVIDER_ID } from "@gitcoin/passport-types";

import { decodeProviderInformation, decodeScoreAttestation, getAttestationData } from "../utils/onChainStamps";
import { FeatureFlags } from "../config/feature_flags";
import { Attestation } from "@ethereum-attestation-service/eas-sdk";

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
  readOnChainData: (overrideChain?: string) => Promise<void>;
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
  const connectedChain = useWalletStore((state) => state.chain);
  const address = useWalletStore((state) => state.address);
  const [onChainProviders, setOnChainProviders] = useState<OnChainProviderMap>({});
  const [activeChainProviders, setActiveChainProviders] = useState<OnChainProviderType[]>([]);
  const [onChainScores, setOnChainScores] = useState<OnChainScores>({});
  const [onChainLastUpdates, setOnChainLastUpdates] = useState<OnChainLastUpdates>({});

  const savePassportLastUpdated = useCallback((attestation: Attestation, chainId: string) => {
    const lastUpdated = new Date(Number(BigInt(attestation.time.toString())) * 1000);
    setOnChainLastUpdates((prevState) => ({
      ...prevState,
      [chainId]: lastUpdated,
    }));
  }, []);

  const readOnChainData = useCallback(
    async (overrideChain?: string) => {
      const chain = overrideChain || connectedChain;
      if (address && chain) {
        try {
          const activeChainIds = chains
            .filter(({ attestationProvider }) => attestationProvider?.status === "enabled")
            .map(({ id }) => id);

          if (!activeChainIds.includes(chain)) {
            setActiveChainProviders([]);
          }

          await Promise.all(
            activeChainIds.map(async (chainId: string) => {
              const passportAttestationData = await getAttestationData(address, chainId as keyof typeof onchainInfo);

              if (!passportAttestationData) {
                if (chainId === chain) {
                  setActiveChainProviders([]);
                }
                return;
              }

              // Only if a passport attestation has been properly loaded
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

              if (chainId === chain) setActiveChainProviders(onChainProviders);

              const score = decodeScoreAttestation(passportAttestationData.score);

              setOnChainScores((prevState) => ({
                ...prevState,
                [chainId]: score,
              }));
            })
          );
        } catch (e: any) {
          console.error("Failed to check onchain status", e);
          datadogLogs.logger.error("Failed to check onchain status", e);
          datadogRum.addError(e);
        }
      }
    },
    [address, connectedChain]
  );

  useEffect(() => {
    if (FeatureFlags.FF_CHAIN_SYNC) {
      readOnChainData();
    }
  }, [readOnChainData, address, connectedChain]);

  // use props as a way to pass configuration values
  const providerProps = useMemo(
    () => ({
      onChainProviders,
      activeChainProviders,
      onChainLastUpdates,
      readOnChainData,
      onChainScores,
    }),
    [onChainProviders, activeChainProviders, onChainLastUpdates, readOnChainData, onChainScores]
  );

  return <OnChainContext.Provider value={providerProps}>{children}</OnChainContext.Provider>;
};
