import { PlatformSpec } from "@gitcoin/passport-platforms";
import { PLATFORM_ID, PROVIDER_ID } from "@gitcoin/passport-types";
import React, { useCallback, useContext, useMemo } from "react";
import { getPlatformSpec } from "../config/platforms";
import { CeramicContext } from "../context/ceramicContext";
import { Button } from "@chakra-ui/react";

type StampsListProps = {
  onChainPlatformIds: PLATFORM_ID[];
  className?: string;
};

const StampsList = ({ className, onChainPlatformIds }: StampsListProps) => {
  const { verifiedPlatforms } = useContext(CeramicContext);

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
              </div>
            );
          })}
      </div>
    </div>
  );
};

export const ZkStampsPanel = ({ className }: { className: string }) => {
  const { verifiedPlatforms, allProvidersState } = useContext(CeramicContext);

  // console.log("geri verifiedPlatforms", verifiedPlatforms);

  for (const _providerId in allProvidersState) {
    const providerId = _providerId as PROVIDER_ID;
    const providerState = allProvidersState[providerId];
    if(providerState?.stamp) {
      console.log("geri providerState?.stamp", providerState?.stamp);
    }
  }

  console.log("geri allProvidersState", allProvidersState);
  return (
    <div
      className={`flex flex-col items-center rounded border border-foreground-3 bg-gradient-to-b from-background to-background-2 text-xl text-foreground-2 ${className}`}
    >
      <div className="my-2">Stamps for ZkProof</div>
      {/* <div className="h-[2px] w-full bg-gradient-to-r from-background via-foreground-2 to-background" />
      <StampsList className="m-6" onChainPlatformIds={onChainPlatformIds} />
      <InitiateOnChainButton className="mb-2" />
      <span className={`mb-2 text-sm ${anyOnchain ? "visible" : "invisible"}`}>
        <OnchainMarker /> = Onchain
      </span> */}
      <Button
        data-testid="connect-button"
        variant="custom"
        className="mt-5 mb-5 w-auto border border-foreground-2 bg-transparent text-foreground-2"
      >
        Generate Zk Proof
      </Button>
    </div>
  );
};
