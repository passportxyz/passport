import { Stamp } from "@gitcoin/passport-types";
import { useContext, useEffect, useState } from "react";
import { CeramicContext, AllProvidersState, ProviderState } from "../context/ceramicContext";
import { OnChainContext, OnChainProviderType } from "../context/onChainContext";
import { ScorerContext, ScoreStateType } from "../context/scorerContext";
import { SyncToChainButton } from "./SyncToChainButton";

type Chain = {
  id: string;
  token: string;
  label: string;
  rpcUrl: string;
  icon: string;
};

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

export function NetworkCard({ chain, activeChains }: { chain: Chain; activeChains: string[] }) {
  const { allProvidersState } = useContext(CeramicContext);
  const { onChainProviders, onChainScore } = useContext(OnChainContext);
  const { rawScore, scoreState } = useContext(ScorerContext);
  const [isActive, setIsActive] = useState(false);
  const [onChainStatus, setOnChainStatus] = useState<OnChainStatus>(OnChainStatus.NOT_MOVED);

  useEffect(() => {
    setIsActive(activeChains.includes(chain.id));
  }, [activeChains, chain.id]);

  useEffect(() => {
    const checkStatus = async () => {
      const savedNetworkProviders = onChainProviders[chain.id] || [];
      const stampStatus = checkOnChainStatus(
        allProvidersState,
        savedNetworkProviders,
        rawScore,
        scoreState,
        onChainScore
      );
      setOnChainStatus(stampStatus);
    };
    checkStatus();
  }, [allProvidersState, chain.id, onChainProviders, onChainScore, rawScore, scoreState]);

  return (
    <div className="mb-6 border border-accent-2 bg-background-2 p-0">
      <div className="mx-4 my-2">
        <div className="flex w-full">
          <div className="mr-4">
            <img className="max-h-6" src={chain.icon} alt={`${chain.label} logo`} />
          </div>
          <div>
            <div className="flex w-full flex-col">
              <h1 className="text-lg text-color-1">{chain.label}</h1>
              <p className="mt-2 text-color-4 md:inline-block">Not moved yet</p>
            </div>
          </div>
        </div>
      </div>
      <SyncToChainButton onChainStatus={onChainStatus} isActive={isActive} />
    </div>
  );
}
