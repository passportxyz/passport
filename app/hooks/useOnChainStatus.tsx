import { useContext, useEffect, useState, useMemo } from "react";
import { CeramicContext } from "../context/ceramicContext";
import { parseFloatOneDecimal, ScorerContext } from "../context/scorerContext";
import { Chain, chains } from "../utils/chains";
import { AttestationProvider } from "../utils/AttestationProvider";
import { OnChainStatus, onChainStatusString } from "../utils/onChainStatus";
import { useOnChainData } from "./useOnChainData";
import { useCustomization } from "./useCustomization";
import { Customization } from "../utils/customizationUtils";

export const parseValidChains = (customization: Customization, chainConfig: Chain) => {
  if (
    chainConfig.attestationProvider?.status === "comingSoon" ||
    chainConfig.attestationProvider?.status === "enabled"
  ) {
    if (chainConfig.attestationProvider.skipByDefault) {
      if (customization.includedChainIds && customization.includedChainIds?.length > 0) {
        return customization.includedChainIds.includes(chainConfig.id);
      } else {
        // By default we don't want to show the mint button for chains labeled with `skipByDefault`
        return false;
      }
    } else {
      if (customization.includedChainIds && customization.includedChainIds?.length > 0) {
        return customization.includedChainIds.includes(chainConfig.id);
      } else {
        return true;
      }
    }
  }
};

export const useOnChainStatus = ({ chain }: { chain?: Chain }): { status: OnChainStatus; isPending: boolean } => {
  const { allProvidersState } = useContext(CeramicContext);
  const { data, isPending } = useOnChainData();
  const { rawScore, scoreState } = useContext(ScorerContext);
  const [onChainStatus, setOnChainStatus] = useState<OnChainStatus>(OnChainStatus.NOT_MOVED);

  useEffect(() => {
    const checkStatus = async () => {
      if (!chain || isPending) return;

      const { score, providers, expirationDate } = data[chain.id] || {
        score: 0,
        providers: [],
      };

      // Get the current active chain attestation provider
      const attestationProvider: AttestationProvider | undefined = chains.find(
        ({ id }) => id === chain?.id
      )?.attestationProvider;

      const status = attestationProvider
        ? attestationProvider.checkOnChainStatus(
            allProvidersState,
            providers,
            rawScore,
            scoreState,
            parseFloatOneDecimal(String(score)),
            expirationDate
          )
        : OnChainStatus.NOT_MOVED;
      setOnChainStatus(status);
    };
    checkStatus();
  }, [allProvidersState, chain, chain?.id, data, isPending, rawScore, scoreState]);

  return { isPending, status: onChainStatus };
};

export const useAllOnChainStatus = () => {
  const { allProvidersState } = useContext(CeramicContext);
  const { data, isPending } = useOnChainData();
  const { rawScore, scoreState } = useContext(ScorerContext);
  const customization = useCustomization();

  const {
    allChainsUpToDate,
    anyChainExpired,
    someChainUpToDate,
    allAttestationProviders,
    onChainAttestationProviders,
  } = useMemo(() => {
    if (isPending) return { allChainsUpToDate: false, anyChainExpired: false };

    const statuses: { attestationProvider?: AttestationProvider; status: OnChainStatus }[] = chains
      .filter((chain) => parseValidChains(customization, chain))
      .map((activeChain) => {
        const { score, providers, expirationDate } = data[activeChain.id] || {
          score: 0,
          providers: [],
        };
        const attestationProvider = activeChain.attestationProvider;

        if (!attestationProvider)
          return {
            status: OnChainStatus.NOT_MOVED,
          };

        return {
          attestationProvider,
          status: attestationProvider.checkOnChainStatus(
            allProvidersState,
            providers,
            rawScore,
            scoreState,
            parseFloatOneDecimal(String(score)),
            expirationDate
          ),
        };
      });

    return {
      allChainsUpToDate: statuses.every(
        (s) => s.status === OnChainStatus.MOVED_UP_TO_DATE || s.status === OnChainStatus.MOVED_OUT_OF_DATE
      ),
      someChainUpToDate: statuses.some(
        (s) => s.status === OnChainStatus.MOVED_UP_TO_DATE || s.status === OnChainStatus.MOVED_OUT_OF_DATE
      ),
      anyChainExpired: statuses.find((s) => s.status === OnChainStatus.MOVED_EXPIRED),
      allAttestationProviders: statuses.filter((s) => !!s.attestationProvider),
      onChainAttestationProviders: statuses.filter(
        (s) => s.status === OnChainStatus.MOVED_UP_TO_DATE || s.status === OnChainStatus.MOVED_OUT_OF_DATE
      ),
    };
  }, [allProvidersState, customization, data, isPending, rawScore, scoreState]);

  return useMemo(
    () => ({
      allChainsUpToDate,
      anyChainExpired,
      isPending,
      someChainUpToDate,
      allAttestationProviders,
      onChainAttestationProviders,
    }),
    [
      allChainsUpToDate,
      anyChainExpired,
      someChainUpToDate,
      isPending,
      allAttestationProviders,
      onChainAttestationProviders,
    ]
  );
};
