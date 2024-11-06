// --- React Methods
import { useCallback, useEffect, useMemo } from "react";

import { datadogLogs } from "@datadog/browser-logs";
import { datadogRum } from "@datadog/browser-rum";
import onchainInfo from "../../deployments/onchainInfo.json";
import { ChainId, chains } from "../utils/chains";

import { PROVIDER_ID } from "@gitcoin/passport-types";

import { getAttestationData } from "../utils/onChainStamps";
import { FeatureFlags } from "../config/feature_flags";
import { UseQueryResult, useQueries, useQueryClient } from "@tanstack/react-query";
import { parseValidChains } from "./useOnChainStatus";
import { useCustomization } from "./useCustomization";
import { useAccount, useChains } from "wagmi";
import { createPublicClient, http, PublicClient } from "viem";

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
  refresh: (chainId?: ChainId) => void;
}

export type DecodedProviderInfo = {
  providerName: PROVIDER_ID;
  providerNumber: number;
};

const ALL_CHAIN_DATA_QUERY_KEY = ["onChain", "passport"];

type GetOnChainDataForChainResult = SingleChainData & { chainId: ChainId };

const getOnChainDataForChain = async ({
  address,
  chainId,
  customScorerId,
  publicClient,
}: {
  address: string;
  chainId: ChainId;
  customScorerId?: number;
  publicClient: PublicClient;
}): Promise<GetOnChainDataForChainResult> => {
  const attestationData = await getAttestationData({
    publicClient,
    address,
    chainId: chainId as keyof typeof onchainInfo,
    customScorerId,
  });

  const score = attestationData?.score.value || 0;
  const expirationDate = attestationData?.score.expirationDate;
  const providers = attestationData?.providers || [];

  return {
    chainId,
    providers,
    score,
    expirationDate,
  };
};

const useOnChainDataQuery = (address?: string) => {
  const wagmiChains = useChains();
  const customization = useCustomization();
  const enabledChains = chains
    .filter(({ attestationProvider }) => attestationProvider?.status === "enabled")
    .filter((chain) => parseValidChains(customization, chain));

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
      {} as Record<ChainId, SingleChainData>
    );

    return {
      data,
      isPending,
      isError,
      error,
    };
  }, []);

  return useQueries({
    queries: enabledChains.map((chain) => {
      const wagmiChain = wagmiChains.find(({ id }) => id === parseInt(chain.id));
      if (!wagmiChain) throw new Error(`Chain ${chain.id} not found in wagmiChains`);

      console.log("wagmiChain", wagmiChain);

      const publicClient = createPublicClient({
        chain: wagmiChain,
        transport: http(String(wagmiChain.rpcUrls[0])),
      });

      const customScorerId = chain.useCustomCommunityId && customization.scorer ? customization.scorer.id : undefined;
      return {
        enabled: FeatureFlags.FF_CHAIN_SYNC && Boolean(address) && Boolean(publicClient),
        queryKey: [...ALL_CHAIN_DATA_QUERY_KEY, address, chain.id, customScorerId],
        queryFn: () =>
          getOnChainDataForChain({ address: address!, chainId: chain.id, customScorerId, publicClient: publicClient! }),
      };
    }),
    combine,
  });
};

export const useOnChainData = (): OnChainData => {
  const { address, chain } = useAccount();
  const chainId = chain?.id.toString(16) as ChainId;
  const queryClient = useQueryClient();

  const { data, isError, error, isPending } = useOnChainDataQuery(address);

  const activeChainProviders = useMemo(
    () => (chainId && data ? data[chainId]?.providers : null) || [],
    [chainId, data]
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
    [address, queryClient]
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
