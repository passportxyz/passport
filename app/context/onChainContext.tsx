// --- React Methods
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

import { datadogLogs } from "@datadog/browser-logs";
import { datadogRum } from "@datadog/browser-rum";
import { UserContext } from "./userContext";
import onchainInfo from "../../deployments/onchainInfo.json";
import { Chain, chains } from "../utils/chains";

import { PROVIDER_ID } from "@gitcoin/passport-types";

import { decodeScoreAttestation, getAttestationData, parsePassportData } from "../utils/onChainStamps";
import { FeatureFlags } from "../config/feature_flags";
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
  const { address } = useContext(UserContext);
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
    if (address) {
      try {
        const activeChains = chains.filter(({ attestationProvider }) => attestationProvider?.status === "enabled");

        await Promise.all(
          activeChains.map(async (chain) => {
            const chainId = chain.id;

            const onChainProviders = (await chain.attestationProvider?.getOnChainPassportData(address, chain)) ?? [];

            setOnChainProviders((prevState) => ({
              ...prevState,
              [chainId]: onChainProviders,
            }));

            if (chainId === connectedChain?.id) setActiveChainProviders(onChainProviders);

            const passportAttestationData = await getAttestationData(address, chainId as keyof typeof onchainInfo);

            if (!passportAttestationData) {
              return;
            }

            savePassportLastUpdated(passportAttestationData.passport, chainId);

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
  }, [address]);

  useEffect(() => {
    if (FeatureFlags.FF_CHAIN_SYNC) {
      readOnChainData();
    }
  }, [readOnChainData, address]);

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
