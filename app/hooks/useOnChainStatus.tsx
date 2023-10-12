import { Stamp } from "@gitcoin/passport-types";
import { useContext, useEffect, useState } from "react";
import { CeramicContext, AllProvidersState, ProviderState } from "../context/ceramicContext";
import { OnChainContext, OnChainProviderType } from "../context/onChainContext";
import { ScorerContext, ScoreStateType } from "../context/scorerContext";
import { Chain } from "../utils/chains";

export enum OnChainStatus {
  NOT_MOVED,
  MOVED_OUT_OF_DATE,
  MOVED_UP_TO_DATE,
}

type ProviderWithStamp = ProviderState & { stamp: Stamp };

export const checkOnChainStatus = (
  allProvidersState: AllProvidersState,
  onChainProviders: OnChainProviderType[],
  rawScore: number,
  scoreState: ScoreStateType,
  onChainScore: number
): OnChainStatus => {
  if (onChainProviders.length === 0) return OnChainStatus.NOT_MOVED;

  if (scoreState === "DONE" && rawScore !== onChainScore) return OnChainStatus.MOVED_OUT_OF_DATE;

  const verifiedDbProviders: ProviderWithStamp[] = Object.values(allProvidersState).filter(
    (provider): provider is ProviderWithStamp => provider.stamp !== undefined
  );

  const [equivalentProviders, differentProviders] = verifiedDbProviders.reduce(
    ([eq, diff], provider): [ProviderWithStamp[], ProviderWithStamp[]] => {
      const expirationDateSeconds = Math.floor(new Date(provider.stamp.credential.expirationDate).valueOf() / 1000);
      const issuanceDateSeconds = Math.floor(new Date(provider.stamp.credential.issuanceDate).valueOf() / 1000);

      const isEquivalent = onChainProviders.some(
        (onChainProvider) =>
          onChainProvider.providerName === provider.stamp.provider &&
          onChainProvider.credentialHash === provider.stamp.credential.credentialSubject?.hash &&
          Math.floor(onChainProvider.expirationDate.valueOf() / 1000) === expirationDateSeconds &&
          Math.floor(onChainProvider.issuanceDate.valueOf() / 1000) === issuanceDateSeconds
      );
      return isEquivalent ? [[...eq, provider], diff] : [eq, [...diff, provider]];
    },
    [[], []] as [ProviderWithStamp[], ProviderWithStamp[]]
  );

  return equivalentProviders.length === onChainProviders.length && differentProviders.length === 0
    ? OnChainStatus.MOVED_UP_TO_DATE
    : OnChainStatus.MOVED_OUT_OF_DATE;
};

export const useOnChainStatus = ({ chain }: { chain?: Chain }) => {
  const { allProvidersState } = useContext(CeramicContext);
  const { onChainProviders, onChainScores } = useContext(OnChainContext);
  const { rawScore, scoreState } = useContext(ScorerContext);
  const [onChainStatus, setOnChainStatus] = useState<OnChainStatus>(OnChainStatus.NOT_MOVED);

  useEffect(() => {
    const checkStatus = async () => {
      if (!chain) return;
      const savedNetworkProviders = onChainProviders[chain.id] || [];
      const stampStatus = checkOnChainStatus(
        allProvidersState,
        savedNetworkProviders,
        rawScore,
        scoreState,
        onChainScores[chain.id]
      );
      setOnChainStatus(stampStatus);
    };
    checkStatus();
  }, [allProvidersState, chain?.id, onChainProviders, onChainScores, rawScore, scoreState]);

  return onChainStatus;
};
