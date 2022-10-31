// --- React Methods
import React, { useContext, useEffect, useRef, useState } from "react";

import { PLATFORMS, PlatformSpec } from "../config/platforms";
import { PlatformGroupSpec, STAMP_PROVIDERS, UpdatedPlatforms } from "../config/providers";

// Providers

import { Twitter, Ens } from "@gitcoin/passport-platforms";

// --- Components
import { LoadingCard } from "./LoadingCard";
import { GenericOauthPlatform } from "./GenericOauthPlatform";
import { GenericEVMPlatform } from "./GenericEVMPlatform";

// --- Identity Providers
import { SideBarContent } from "./SideBarContent";

// --- Chakra UI Elements
import { Drawer, DrawerOverlay, useDisclosure } from "@chakra-ui/react";
import { PLATFORM_ID, PROVIDER_ID } from "@gitcoin/passport-types";
import { CeramicContext } from "../context/ceramicContext";
import { PlatformCard } from "./PlatformCard";

export type CardListProps = {
  isLoading?: boolean;
};

type SelectedProviders = Record<PLATFORM_ID, PROVIDER_ID[]>;

export const CardList = ({ isLoading = false }: CardListProps): JSX.Element => {
  const { allProvidersState } = useContext(CeramicContext);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const btnRef = useRef();
  const [currentPlatform, setCurrentPlatform] = useState<PlatformSpec | undefined>();
  const [currentProviders, setCurrentProviders] = useState<PlatformGroupSpec[]>([]);
  const [updatedPlatforms, setUpdatedPlatforms] = useState<UpdatedPlatforms | undefined>();

  // get the selected Providers
  const [selectedProviders, setSelectedProviders] = useState<SelectedProviders>(
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
    switch (currentPlatform?.platform) {
      case "Twitter":
        return <GenericOauthPlatform platformId={"Twitter"} platformgroupspec={Twitter.TwitterProviderConfig} />;
      case "Ens":
        return <GenericEVMPlatform platformId={"Ens"} platFormGroupSpec={Ens.EnsProviderConfig} />;
      // case "Github":
      //   return <GithubPlatform />;
      // case "Gitcoin":
      //   return <GitcoinPlatform />;
      // case "Facebook":
      //   return <FacebookPlatform />;
      // case "Snapshot":
      //   return <SnapshotPlatform />;
      // case "Google":
      //   return <GooglePlatform />;
      // case "Linkedin":
      //   return <LinkedinPlatform />;
      // case "ETH":
      //   return <EthPlatform />;
      // case "GitPOAP":
      //   return <GitPOAPPlatform />;
      // case "Discord":
      //   return <DiscordPlatform />;
      // case "POAP":
      //   return <PoapPlatform />;
      // case "Ens":
      //   return <EnsPlatform />;
      // case "Brightid":
      //   return <BrightidPlatform />;
      // case "Poh":
      //   return <PohPlatform />;
      // case "GTC":
      //   return <GtcPlatform />;
      // case "GtcStaking":
      //   return <GtcStakingPlatform />;
      // case "NFT":
      //   return <NftPlatform />;
      // case "ZkSync":
      //   return <ZkSyncPlatform />;
      // case "Lens":
      //   return <LensPlatform />;
      // case "GnosisSafe":
      //   return <GnosisSafePlatform />;
      default:
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
    }
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
