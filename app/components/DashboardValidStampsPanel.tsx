import { PlatformSpec } from "@gitcoin/passport-platforms";
import { PLATFORM_ID } from "@gitcoin/passport-types";
import React, { useCallback, useContext, useMemo } from "react";
import { usePlatformSpecs } from "../config/platforms";
import { CeramicContext } from "../context/ceramicContext";
import InitiateOnChainButton from "./InitiateOnChainButton";
import { useOnChainData } from "../hooks/useOnChainData";

type StampsListProps = {
  onChainPlatformIds: PLATFORM_ID[];
  className?: string;
};

const OnchainMarker = ({ className }: { className?: string }) => (
  <span className={`text-sm text-[#06CB9E] ${className}`}>⏺</span>
);

const StampsList = ({ className, onChainPlatformIds }: StampsListProps) => {
  const { verifiedPlatforms } = useContext(CeramicContext);
  const getPlatformSpec = usePlatformSpecs();

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className={`flex flex-wrap justify-center gap-8`}>
        {Object.values(verifiedPlatforms)
          .map((platform) => getPlatformSpec(platform.platform.platformId))
          .filter((platformSpec): platformSpec is PlatformSpec => !!platformSpec)
          .map((platformSpec) => {
            // check if platform has onchain providers
            return (
              <div key={platformSpec.platform} className="flex flex-col items-center">
                <img alt="Platform Icon" src={platformSpec.icon} className="col-start-1 row-start-1 h-8 w-8" />
                <OnchainMarker
                  className={onChainPlatformIds.includes(platformSpec.platform) ? "visible" : "invisible"}
                />
              </div>
            );
          })}
      </div>
    </div>
  );
};

export const DashboardValidStampsPanel = ({ className }: { className: string }) => {
  const { verifiedPlatforms, allProvidersState } = useContext(CeramicContext);
  const { activeChainProviders } = useOnChainData();

  const hasOnchainProviders = useCallback(
    (platformId: PLATFORM_ID) => {
      const providerIds = verifiedPlatforms[platformId]?.platFormGroupSpec
        .map(({ providers }) => providers.map(({ name }) => name))
        .flat();

      return providerIds?.some((providerId) => {
        const providerObj = activeChainProviders.find((p) => p.providerName === providerId);
        if (providerObj) {
          return providerObj.credentialHash === allProvidersState[providerId]?.stamp?.credential.credentialSubject.hash;
        }

        return false;
      });
    },
    [activeChainProviders, allProvidersState, verifiedPlatforms]
  );

  const onChainPlatformIds = useMemo(
    () => (Object.keys(verifiedPlatforms) as PLATFORM_ID[]).filter((platformId) => hasOnchainProviders(platformId)),
    [hasOnchainProviders, verifiedPlatforms]
  );

  const anyOnchain = useMemo(() => onChainPlatformIds.length > 0, [onChainPlatformIds]);

  return (
    <div
      className={`flex flex-col items-center rounded border border-foreground-3 bg-gradient-to-b from-background to-background-2 text-xl text-foreground-2 ${className}`}
    >
      <div className="my-2">Valid Stamps</div>
      <div className="h-[2px] w-full bg-gradient-to-r from-background via-foreground-2 to-background" />
      <StampsList className="m-6" onChainPlatformIds={onChainPlatformIds} />
      <InitiateOnChainButton className="mb-2" />
      <span className={`mb-2 text-sm ${anyOnchain ? "visible" : "invisible"}`}>
        <OnchainMarker /> = Onchain
      </span>
    </div>
  );
};
