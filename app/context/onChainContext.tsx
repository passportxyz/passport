// --- React Methods
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

import { datadogLogs } from "@datadog/browser-logs";
import { datadogRum } from "@datadog/browser-rum";
import { UserContext } from "./userContext";

import { PROVIDER_ID, Passport } from "@gitcoin/passport-types";

import { decodeProviderInformation, getAttestationData } from "../utils/onChainStamps";
import { ScorerContext } from "./scorerContext";
import { CeramicContext } from "./ceramicContext";

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
  readOnChainData: () => Promise<void>;
}

const startingState: OnChainContextState = {
  onChainProviders: {},
  activeChainProviders: [],
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
  const { rawScore, scoreState } = useContext(ScorerContext);
  const { passport } = useContext(CeramicContext);
  const [inSync, setInSync] = useState<boolean>(true);

  useEffect(() => {
    if (
      process.env.NEXT_PUBLIC_FF_CHAIN_SYNC === "on" &&
      inSync &&
      scoreState === "DONE" &&
      passport &&
      (!scoreMatchesOnChain() ||
        anyStampsOnlyOffChain(passport, activeChainProviders) ||
        anyStampsOnlyOnChain(passport, activeChainProviders))
    ) {
      setInSync(false);
    } else {
      setInSync(true);
    }
  }, [scoreState, passport, activeChainProviders, rawScore, onChainScore]);

  const anyStampsOnlyOffChain = useCallback((passport: Passport, onChainProviders: OnChainProviderType[]) => {
    return (
      passport &&
      passport.stamps.find((stamp) => {
        const expirationDate = new Date(stamp.credential.expirationDate);
        const issuanceDate = new Date(stamp.credential.issuanceDate);

        return !onChainProviders.find(
          (onChainProvider) =>
            onChainProvider.providerName === stamp.provider &&
            onChainProvider.credentialHash === stamp.credential.credentialSubject.hash &&
            onChainProvider.expirationDate === expirationDate &&
            onChainProvider.issuanceDate === issuanceDate
        );
      })
    );
  }, []);

  const anyStampsOnlyOnChain = useCallback((passport: Passport, onChainProviders: OnChainProviderType[]) => {
    return onChainProviders.find(
      (onChainProvider) =>
        !(
          passport &&
          passport.stamps.find((stamp) => {
            return (
              onChainProvider.providerName === stamp.provider &&
              onChainProvider.credentialHash === stamp.credential.credentialSubject.hash &&
              onChainProvider.expirationDate === new Date(stamp.credential.expirationDate) &&
              onChainProvider.issuanceDate === new Date(stamp.credential.issuanceDate)
            );
          })
        )
    );
  }, []);

  const scoreMatchesOnChain = () => rawScore === onChainScore;

  const readOnChainData = useCallback(async () => {
    if (wallet && address && !inSync) {
      try {
        const passportAttestationData = await getAttestationData(wallet, address);

        if (!passportAttestationData) {
          return;
        }

        const { onChainProviderInfo, hashes, issuanceDates, expirationDates } = await decodeProviderInformation(
          passportAttestationData
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
        setOnChainScore(1); // TODO
      } catch (e: any) {
        datadogLogs.logger.error("Failed to check on-chain status", e);
        datadogRum.addError(e);
      }
    }
  }, [wallet, address]);

  // use props as a way to pass configuration values
  const providerProps = {
    onChainProviders,
    activeChainProviders,
    readOnChainData,
    inSync,
  };

  return <OnChainContext.Provider value={providerProps}>{children}</OnChainContext.Provider>;
};
