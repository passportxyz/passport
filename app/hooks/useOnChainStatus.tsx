import { useContext, useEffect, useState } from "react";
import { CeramicContext } from "../context/ceramicContext";
import { OnChainContext } from "../context/onChainContext";
import { ScorerContext } from "../context/scorerContext";
import { Chain, chains } from "../utils/chains";
import { AttestationProvider } from "../utils/AttestationProvider";

export enum OnChainStatus {
  LOADING,
  NOT_MOVED,
  MOVED_OUT_OF_DATE,
  MOVED_UP_TO_DATE,
}

export const useOnChainStatus = ({ chain }: { chain?: Chain }) => {
  const { allProvidersState } = useContext(CeramicContext);
  const { onChainProviders, onChainScores } = useContext(OnChainContext);
  const { rawScore, scoreState } = useContext(ScorerContext);
  const [onChainStatus, setOnChainStatus] = useState<OnChainStatus>(OnChainStatus.NOT_MOVED);

  useEffect(() => {
    const checkStatus = async () => {
      if (!chain) return;

      // Get the current active chain attestation provider
      const attestationProvider: AttestationProvider | undefined = chains.find(
        ({ id }) => id === chain?.id
      )?.attestationProvider;

      const savedNetworkProviders = onChainProviders[chain.id] || [];
      const stampStatus = attestationProvider
        ? attestationProvider.checkOnChainStatus(
            allProvidersState,
            savedNetworkProviders,
            rawScore,
            scoreState,
            onChainScores[chain.id]
          )
        : OnChainStatus.NOT_MOVED;
      setOnChainStatus(stampStatus);
    };
    checkStatus();
  }, [allProvidersState, chain?.id, onChainProviders, onChainScores, rawScore, scoreState]);

  return onChainStatus;
};
