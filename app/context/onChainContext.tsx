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

  const parsePassportData = (passportResponse: any): OnChainProviderType[] => {
    return passportResponse.map((passport: any) => ({
      providerName: passport[0],
      credentialHash: `v0.0.0:${Buffer.from(passport[1].replace(/^0x/, ""), "hex").toString("base64")}`,
      expirationDate: Number(passport[3]) * 1000,
      issuanceDate: Number(passport[2]) * 1000,
    }));
  };

  const readOnChainData = useCallback(async () => {
    if (address) {
      try {
        const activeChains = chains.filter(({ attestationProvider }) => attestationProvider?.status === "enabled");

        await Promise.all(
          activeChains.map(async (chain) => {
            const chainId = chain.id;

            const decoderContract = await loadDecoderContract(chain);

            const onChainProviders = parsePassportData(await decoderContract.getPassport(address));
            const passportAttestationData = await getAttestationData(address, chainId as keyof typeof onchainInfo);

            if (!passportAttestationData) {
              return;
            }

            savePassportLastUpdated(passportAttestationData.passport, chainId);

            console.log({ onChainProviders });

            // Set the onchain status
            setOnChainProviders((prevState) => ({
              ...prevState,
              [chainId]: onChainProviders,
            }));

            if (chainId === connectedChain?.id) setActiveChainProviders(onChainProviders);

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
