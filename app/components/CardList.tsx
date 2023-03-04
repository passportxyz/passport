// --- React Methods
import React, { useContext, useEffect, useRef, useState } from "react";

import { PLATFORMS, PlatformSpec } from "../config/platforms";
import { PlatformGroupSpec, STAMP_PROVIDERS, UpdatedPlatforms } from "../config/providers";

// --- Components
import { LoadingCard } from "./LoadingCard";
import { GenericPlatform } from "./GenericPlatform";

// --- Identity Providers
import { SideBarContent } from "./SideBarContent";

// --- Chakra UI Elements
import { Drawer, DrawerOverlay, useDisclosure } from "@chakra-ui/react";
import { PLATFORM_ID, PROVIDER_ID } from "@gitcoin/passport-platforms/dist/commonjs/types";
import { CeramicContext } from "../context/ceramicContext";
import { useStampStorage } from "../context/stampStorageContext";
import { PlatformCard } from "./PlatformCard";

export type CardListProps = {
  isLoading?: boolean;
};

type SelectedProviders = Record<PLATFORM_ID, PROVIDER_ID[]>;

export const CardList = ({ isLoading = false }: CardListProps): JSX.Element => {
  const { allProvidersState, allPlatforms } = useContext(CeramicContext);
  const { stamps } = useStampStorage();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const btnRef = useRef();
  const [currentPlatform, setCurrentPlatform] = useState<PlatformSpec | undefined>();
  const [currentProviders, setCurrentProviders] = useState<PlatformGroupSpec[]>([]);
  const [updatedPlatforms, setUpdatedPlatforms] = useState<UpdatedPlatforms | undefined>();

  // get the selected Providers
  const [selectedProviders, setSelectedProviders] = useState<SelectedProviders>(
    PLATFORMS.reduce((platforms, platform) => {
      // get all providerIds for this platform
      const providerIds =
        STAMP_PROVIDERS[platform.platform]?.reduce((all, stamp) => {
          return all.concat(stamp.providers?.map((provider) => provider.name as PROVIDER_ID));
        }, [] as PROVIDER_ID[]) || [];
      return {
        ...platforms,
        // default to empty array for each platform
        [platform.platform]: providerIds.filter(
          (providerId) => stamps.find((stamp) => stamp.provider === providerId) !== undefined
        ),
      };
    }, {} as SelectedProviders)
  );

  const getUpdatedPlatforms = () => {
    const previouslyUpdatedPlatforms = localStorage.getItem("updatedPlatforms");
    setUpdatedPlatforms(JSON.parse(previouslyUpdatedPlatforms || "{}"));
  };

  // update when verifications change...
  useEffect(() => {
    // update all verfied states
    setSelectedProviders(
      PLATFORMS.reduce((plaforms, platform) => {
        // get all providerIds for this platform
        const providerIds =
          STAMP_PROVIDERS[platform.platform]?.reduce((all, stamp) => {
            return all.concat(stamp.providers?.map((provider) => provider.name as PROVIDER_ID));
          }, [] as PROVIDER_ID[]) || [];
        // default to empty array for each platform
        plaforms[platform.platform] = providerIds.filter(
          (providerId) => typeof allProvidersState[providerId]?.stamp?.credential !== "undefined"
        );
        // return all platforms
        return plaforms;
      }, {} as SelectedProviders)
    );
    getUpdatedPlatforms();
  }, [allProvidersState]);
  // Add the platforms to this switch so the sidebar content can populate dynamically
  const renderCurrentPlatformSelection = () => {
    if (currentPlatform) {
      const platformProps = allPlatforms.get(currentPlatform.platform);
      if (platformProps) {
        return (
          <GenericPlatform platform={platformProps.platform} platFormGroupSpec={platformProps.platFormGroupSpec} />
        );
      }
    }
    return (
      <SideBarContent
        verifiedProviders={undefined}
        selectedProviders={undefined}
        setSelectedProviders={undefined}
        currentPlatform={undefined}
        currentProviders={undefined}
        isLoading={undefined}
        verifyButton={undefined}
      />
    );
  };

  useEffect(() => {
    // set providers for the current platform
    if (currentPlatform) {
      setCurrentProviders(STAMP_PROVIDERS[currentPlatform.platform]);
    }
  }, [currentPlatform]);

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-wrap md:-m-4 md:px-4">
        {PLATFORMS.map((platform, i) => {
          return isLoading ? (
            <LoadingCard key={i} />
          ) : (
            <PlatformCard
              i={i}
              key={i}
              platform={platform}
              btnRef={btnRef}
              onOpen={onOpen}
              selectedProviders={selectedProviders}
              updatedPlatforms={updatedPlatforms}
              getUpdatedPlatforms={getUpdatedPlatforms}
              setCurrentPlatform={setCurrentPlatform}
            />
          );
        })}
      </div>
      {/* sidebar */}
      {currentProviders && (
        <Drawer isOpen={isOpen} placement="right" size="sm" onClose={onClose} finalFocusRef={btnRef.current}>
          <DrawerOverlay />
          {renderCurrentPlatformSelection()}
        </Drawer>
      )}
    </div>
  );
};
