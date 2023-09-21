import { Stamp } from "@gitcoin/passport-types";
import { useContext, useEffect, useState } from "react";
import { CeramicContext, AllProvidersState, ProviderState } from "../context/ceramicContext";
import { OnChainContext, OnChainProviderType } from "../context/onChainContext";
import { ScorerContext, ScoreStateType } from "../context/scorerContext";
import { SyncToChainButton } from "./SyncToChainButton";
import { Chain } from "../utils/chains";
import { FeatureFlags } from "../config/feature_flags";

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

export function NetworkCard({ chain }: { chain: Chain }) {
  const { allProvidersState } = useContext(CeramicContext);
  const { onChainProviders, onChainScores, onChainLastUpdates } = useContext(OnChainContext);
  const { rawScore, scoreState } = useContext(ScorerContext);
  const [onChainStatus, setOnChainStatus] = useState<OnChainStatus>(OnChainStatus.NOT_MOVED);

  useEffect(() => {
    const checkStatus = async () => {
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
  }, [allProvidersState, chain.id, onChainProviders, onChainScores, rawScore, scoreState]);

  return (
    <div className="mb-6 rounded border border-foreground-6 bg-background-4 p-0 text-color-2">
      <div className="mx-4 my-2">
        <div className="flex w-full">
          <div className="mr-4 mt-1">
            <img className="max-h-6" src={chain.icon} alt={`${chain.label} logo`} />
          </div>
          <div>
            <div className="flex w-full flex-col">
              <h1 className="text-lg text-color-1">{chain.label}</h1>
              {FeatureFlags.FF_LINEA_ATTESTATIONS && <h2 className="text-sm">{chain.attestationProvider?.name}</h2>}
              <p className="mt-2 md:inline-block">
                {onChainLastUpdates[chain.id] ? onChainLastUpdates[chain.id].toLocaleString() : "Not moved yet"}
              </p>
            </div>
          </div>
        </div>
      </div>
      <SyncToChainButton className="border-t border-foreground-6" onChainStatus={onChainStatus} chain={chain} />
    </div>
  );
}
