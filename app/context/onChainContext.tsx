// --- React Methods
import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";

import { datadogLogs } from "@datadog/browser-logs";
import { datadogRum } from "@datadog/browser-rum";
import { useWalletStore } from "./walletStore";
import onchainInfo from "../../deployments/onchainInfo.json";
import { Chain, chains } from "../utils/chains";

import { PROVIDER_ID } from "@gitcoin/passport-types";

import { decodeScoreAttestation, getAttestationData, parsePassportData } from "../utils/onChainStamps";
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
      const chainId = overrideChain || connectedChain;
      if (address && chainId) {
        try {
          const activeChains = chains.filter(({ attestationProvider }) => attestationProvider?.status === "enabled");

          if (!activeChains.map((chain) => chain.id).includes(chainId)) {
            setActiveChainProviders([]);
          }

          await Promise.all(
            activeChains.map(async (chain) => {
              const passportAttestationData = await getAttestationData(address, chainId as keyof typeof onchainInfo);

              if (!passportAttestationData) {
                if (chainId === chain.id) {
                  setActiveChainProviders([]);
                }
                return;
              }

              savePassportLastUpdated(passportAttestationData.passport, chainId);

              const onChainProviders = (await chain.attestationProvider?.getOnChainPassportData(address, chain)) ?? [];

              // Set the onchain status
              setOnChainProviders((prevState) => ({
                ...prevState,
                [chainId]: onChainProviders,
              }));

              if (chainId === chain.id) setActiveChainProviders(onChainProviders);

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
