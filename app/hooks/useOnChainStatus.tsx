import { useContext, useEffect, useState } from "react";
import { CeramicContext } from "../context/ceramicContext";
import { ScorerContext } from "../context/scorerContext";
import { Chain, chains } from "../utils/chains";
import { AttestationProvider, OnChainState } from "../utils/AttestationProvider";
import { OnChainStatus } from "../utils/onChainStatus";
import { useOnChainData } from "./useOnChainData";

export const useOnChainState = ({ chain }: { chain?: Chain }): OnChainState => {
  const { allProvidersState } = useContext(CeramicContext);
  const { data, isPending } = useOnChainData();
  const { rawScore, scoreState } = useContext(ScorerContext);
  const [onChainStatus, setOnChainStatus] = useState<OnChainStatus>(OnChainStatus.NOT_MOVED);

  useEffect(() => {
    const checkStatus = async () => {
      if (!chain || isPending) return;

      const { score, providers } = data[chain.id] || { score: 0, providers: [] };

      // Get the current active chain attestation provider
      const attestationProvider: AttestationProvider | undefined = chains.find(
        ({ id }) => id === chain?.id
      )?.attestationProvider;

      const { status } = attestationProvider
        ? attestationProvider.checkOnChainState(allProvidersState, providers, rawScore, scoreState, score)
        : { status: OnChainStatus.NOT_MOVED };
      setOnChainStatus(status);
    };
    checkStatus();
  }, [allProvidersState, chain?.id, data, isPending, rawScore, scoreState]);

  return { status: onChainStatus };
};
