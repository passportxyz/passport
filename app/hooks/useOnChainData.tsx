// --- React Methods
import { useCallback, useEffect, useMemo } from "react";

import { datadogLogs } from "@datadog/browser-logs";
import { datadogRum } from "@datadog/browser-rum";
import { useWalletStore } from "../context/walletStore";
import onchainInfo from "../../deployments/onchainInfo.json";
import { chains } from "../utils/chains";

import { PROVIDER_ID } from "@gitcoin/passport-types";

import { decodeProviderInformation, decodeScoreAttestation, getAttestationData } from "../utils/onChainStamps";
import { FeatureFlags } from "../config/feature_flags";
import { UseQueryResult, useQueries, useQueryClient } from "@tanstack/react-query";

const ENABLED_CHAIN_IDS = chains
  .filter(({ attestationProvider }) => attestationProvider?.status === "enabled")
  .map(({ id }) => id);

export interface OnChainProviderMap {
  [chainId: string]: OnChainProviderType[];
}

export interface OnChainLastUpdates {
  [chainId: string]: Date;
}

type SingleChainData = {
  score: number;
  providers: OnChainProviderType[];
  expirationDate?: Date;
};

export interface OnChainScores {
  [chainId: string]: number;
}

export type OnChainProviderType = {
  providerName: PROVIDER_ID;
  credentialHash: string;
  expirationDate: Date;
  issuanceDate: Date;
};

export interface OnChainData {
  data: Record<string, SingleChainData | undefined>;
  activeChainProviders: OnChainProviderType[];
  isPending: boolean;
  refresh: (chainId?: string) => void;
}

export type DecodedProviderInfo = {
  providerName: PROVIDER_ID;
  providerNumber: number;
};

const ALL_CHAIN_DATA_QUERY_KEY = ["onChain", "passport"];

type GetOnChainDataForChainResult = SingleChainData & { chainId: string };

const getOnChainDataForChain = async ({
  address,
  chainId,
}: {
  address: string;
  chainId: string;
}): Promise<GetOnChainDataForChainResult> => {
  const passportAttestationData = await getAttestationData(address, chainId as keyof typeof onchainInfo);
  let providers: OnChainProviderType[] = [];
  let score = 0;
  let expirationDate: Date | undefined;
  if (passportAttestationData) {
    const { onChainProviderInfo, hashes, issuanceDates, expirationDates } = await decodeProviderInformation(
      passportAttestationData.passport
    );

    console.log({ onChainProviderInfo, hashes, issuanceDates, expirationDates })
    providers = onChainProviderInfo
      .sort((a, b) => a.providerNumber - b.providerNumber)
      .map((providerInfo, index) => ({
        providerName: providerInfo.providerName,
        credentialHash: `v0.0.0:${Buffer.from(hashes[index].slice(2), "hex").toString("base64")}`,
        expirationDate: new Date(Number(expirationDates[index]) * 1000),
        issuanceDate: new Date(Number(issuanceDates[index]) * 1000),
      }));

    ({ score, expirationDate } = decodeScoreAttestation(passportAttestationData.score));
  }

  return {
    chainId,
    providers,
    score,
    expirationDate,
  };
};

const useOnChainDataQuery = (address?: string) => {
  // Combines results of all queries into a single object
  const combine = useCallback((results: UseQueryResult<GetOnChainDataForChainResult>[]) => {
    const isPending = results.some((result) => result.isPending);
    const isError = results.some((result) => result.isError);
    const error = results.find((result) => result.isError)?.error;

    const data = results.reduce(
      (acc, { data }) => {
        if (data) {
          const { chainId, ...rest } = data;
          acc[chainId] = rest;
        }
        return acc;
      },
      {} as Record<string, SingleChainData>
    );

    return {
      data,
      isPending,
      isError,
      error,
    };
  }, []);

  return useQueries({
    queries: ENABLED_CHAIN_IDS.map((chainId) => ({
      enabled: FeatureFlags.FF_CHAIN_SYNC && Boolean(address),
      queryKey: [ALL_CHAIN_DATA_QUERY_KEY, address, chainId],
      queryFn: () => getOnChainDataForChain({ address: address!, chainId }),
    })),
    combine,
  });
};

export const useOnChainData = (): OnChainData => {
  const connectedChain = useWalletStore((state) => state.chain);
  const address = useWalletStore((state) => state.address);
  const queryClient = useQueryClient();

  const { data, isError, error, isPending } = useOnChainDataQuery(address);

  const activeChainProviders = useMemo(
    () => (connectedChain && data ? data[connectedChain]?.providers : null) || [],
    [connectedChain, data]
  );

  useEffect(() => {
    if (isError && error) {
      console.error("Failed to check onchain status", error);
      datadogLogs.logger.error("Failed to check onchain status", error);
      datadogRum.addError(error);
    }
  }, [isError, error]);

  const refresh = useCallback(
    (chainId?: string) => {
      const queryKey = [...ALL_CHAIN_DATA_QUERY_KEY, address];
      if (chainId) {
        queryKey.push(chainId);
      }
      queryClient.invalidateQueries({ queryKey });
    },
    [queryClient]
  );

  return useMemo(
    () => ({
      data: data || {},
      activeChainProviders,
      isPending,
      refresh,
    }),
    [data, activeChainProviders, isPending, refresh]
  );
};
