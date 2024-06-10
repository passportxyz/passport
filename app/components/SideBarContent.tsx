import React, { useContext, useEffect, useState } from "react";

// --- Chakra UI Elements
import { DrawerBody, DrawerHeader, DrawerContent, DrawerCloseButton, useDisclosure } from "@chakra-ui/react";

import { PlatformGroupSpec, PlatformBanner } from "@gitcoin/passport-platforms";

import { PLATFORM_ID, PROVIDER_ID } from "@gitcoin/passport-types";

import { StampSelector } from "./StampSelector";
import { PlatformDetails } from "./PlatformDetails";
import { PlatformScoreSpec } from "../context/scorerContext";
import { RemoveStampModal } from "./RemoveStampModal";
import { STAMP_PROVIDERS } from "../config/providers";
import { CeramicContext } from "../context/ceramicContext";

export type SideBarContentProps = {
  currentPlatform: PlatformScoreSpec | undefined;
  currentProviders: PlatformGroupSpec[] | undefined;
  verifiedProviders: PROVIDER_ID[] | undefined;
  isLoading: boolean | undefined;
  verifyButton: JSX.Element | undefined;
  onClose: () => void;
  bannerConfig?: PlatformBanner;
};

export const SideBarContent = ({
  onClose,
  currentPlatform,
  currentProviders,
  verifiedProviders,
  isLoading,
  verifyButton,
  bannerConfig,
}: SideBarContentProps): JSX.Element => {
  const { handleDeleteStamps } = useContext(CeramicContext);
  const [allProviderIds, setAllProviderIds] = useState<PROVIDER_ID[]>([]);

  // alter select-all state when items change
  useEffect(() => {
    // find all providerIds
    const providerIds =
      currentProviders?.reduce((all, stamp) => {
        return all.concat(stamp.providers?.map((provider) => provider.name as PROVIDER_ID));
      }, [] as PROVIDER_ID[]) || [];

    setAllProviderIds(providerIds);
  }, [currentProviders]);

  return (
    <DrawerContent
      style={{
        backgroundColor: "rgb(var(--color-background))",
        border: "1px solid rgb(var(--color-foreground-5))",
        borderRadius: "6px",
      }}
    >
      <DrawerCloseButton disabled={isLoading} className={`visible z-10 text-color-1 md:invisible`} />
      {currentPlatform && currentProviders ? (
        <div className="overflow-auto p-10 text-color-1">
          <DrawerHeader
            style={{
              fontWeight: "inherit",
              padding: "0",
            }}
          >
            <PlatformDetails
              currentPlatform={currentPlatform}
              bannerConfig={bannerConfig}
              verifiedProviders={verifiedProviders}
              onClose={onClose}
            />
          </DrawerHeader>
          {verifyButton}
          <DrawerBody
            style={{
              padding: "0",
            }}
          >
            <div>
              <StampSelector
                currentPlatform={currentPlatform}
                currentProviders={currentProviders}
                verifiedProviders={verifiedProviders}
              />
            </div>
          </DrawerBody>
        </div>
      ) : (
        <div>
          <DrawerHeader>
            <div className="mt-10 flex flex-col md:flex-row">
              <div className="w-full text-center md:py-8 md:pr-8">The requested Platform or Provider was not found</div>
            </div>
          </DrawerHeader>
        </div>
      )}
    </DrawerContent>
  );
};
