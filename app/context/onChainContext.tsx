// --- React Methods
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

import { datadogLogs } from "@datadog/browser-logs";
import { datadogRum } from "@datadog/browser-rum";
import { UserContext } from "./userContext";
import onchainInfo from "../../deployments/onchainInfo.json";
import { Chain, chains } from "../utils/chains";

import { PROVIDER_ID } from "@gitcoin/passport-types";

import { decodeProviderInformation, decodeScoreAttestation, getAttestationData } from "../utils/onChainStamps";
import { FeatureFlags } from "../config/feature_flags";
import { Attestation } from "@ethereum-attestation-service/eas-sdk";
import { useSetChain } from "@web3-onboard/react";
import { ethers } from "ethers";
import { Contract } from "ethers";

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

  const loadDecoderContract = (chain: Chain): Contract => {
    if (chain.attestationProvider?.status !== "enabled") {
      throw new Error(`Active attestationProvider not found for chainId ${chain.id}`);
    }

    const provider = new ethers.JsonRpcProvider(chain.rpcUrl);

    const decoderAddress = chain.attestationProvider.decoderAddress();
    const decoderAbi = chain.attestationProvider.decoderAbi();

    return new ethers.Contract(decoderAddress, decoderAbi, provider);
  };

  const readOnChainData = useCallback(async () => {
    if (address) {
      try {
        const activeChains = chains.filter(({ attestationProvider }) => attestationProvider?.status === "enabled");
        // const decoderContract = await loadDecoderContract(wallet);

        const passportDecoder = await Promise.all(
          activeChains.map(async (chain) => {
            const decoderContract = await loadDecoderContract(chain);

            const passportData = await decoderContract.getPassport(address);
            debugger;

            // const passportAttestationData = await getAttestationData(address, chainId as keyof typeof onchainInfo);

            // if (!passportAttestationData) {
            //   return;
            // }

            // // Only if a passport attestation has been properly loaded
            // const { onChainProviderInfo, hashes, issuanceDates, expirationDates } = await decodeProviderInformation(
            //   passportAttestationData.passport
            // );

            // savePassportLastUpdated(passportAttestationData.passport, chainId);

            // const onChainProviders: OnChainProviderType[] = onChainProviderInfo
            //   .sort((a, b) => a.providerNumber - b.providerNumber)
            //   .map((providerInfo, index) => ({
            //     providerName: providerInfo.providerName,
            //     credentialHash: `v0.0.0:${Buffer.from(hashes[index].slice(2), "hex").toString("base64")}`,
            //     expirationDate: new Date(expirationDates[index].toNumber() * 1000),
            //     issuanceDate: new Date(issuanceDates[index].toNumber() * 1000),
            //   }));

            // // Set the onchain status
            // setOnChainProviders((prevState) => ({
            //   ...prevState,
            //   [chainId]: onChainProviders,
            // }));

            // if (chainId === connectedChain?.id) setActiveChainProviders(onChainProviders);

            // const score = decodeScoreAttestation(passportAttestationData.score);

            // setOnChainScores((prevState) => ({
            //   ...prevState,
            //   [chainId]: score,
            // }));
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
