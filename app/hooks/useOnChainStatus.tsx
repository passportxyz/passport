import { useContext, useEffect, useState } from "react";
import { CeramicContext } from "../context/ceramicContext";
import { OnChainContext } from "../context/onChainContext";
import { ScorerContext } from "../context/scorerContext";
import { Chain, chains } from "../utils/chains";
import { AttestationProvider, OnChainState } from "../utils/AttestationProvider";
import { OnChainStatus } from "../utils/onChainStatus";

export const useOnChainState = ({ chain }: { chain?: Chain }): OnChainState => {
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
      const { status } = attestationProvider
        ? attestationProvider.checkOnChainState(
            allProvidersState,
            savedNetworkProviders,
            rawScore,
            scoreState,
            onChainScores[chain.id]
          )
        : { status: OnChainStatus.NOT_MOVED };
      setOnChainStatus(status);
    };
    checkStatus();
  }, [allProvidersState, chain?.id, onChainProviders, onChainScores, rawScore, scoreState]);

  return { status: onChainStatus };
};
