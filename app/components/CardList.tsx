// --- React Methods
import React, { useContext, useEffect, useRef, useState } from "react";

import { PLATFORMS, PlatformSpec } from "../config/platforms";
import { PlatformGroupSpec, STAMP_PROVIDERS } from "../config/providers";

// --- Context
import { CeramicContext } from "../context/ceramicContext";

// --- Components
import { JsonOutputModal } from "./JsonOutputModal";
import { LoadingCard } from "./LoadingCard";

// --- Identity Providers
import {
  GooglePlatform,
  EnsPlatform,
  PohPlatform,
  TwitterPlatform,
  PoapPlatform,
  FacebookPlatform,
  BrightidPlatform,
  GithubPlatform,
  LinkedinPlatform,
  GitcoinPlatform,
  DiscordPlatform,
  // SignerCard,
  GitPOAPPlatform,
  SnapshotPlatform,
  EthPlatform,
  GtcPlatform,
  GtcStakingPlatform,
} from "./PlatformCards";
import { SideBarContent } from "./SideBarContent";

// --- Chakra UI Elements
import { Drawer, DrawerOverlay, Menu, MenuButton, MenuItem, MenuList, Spinner, useDisclosure } from "@chakra-ui/react";
import { PLATFORM_ID, PROVIDER_ID } from "@gitcoin/passport-types";

export type CardListProps = {
  isLoading?: boolean;
};

type SelectedProviders = Record<PLATFORM_ID, PROVIDER_ID[]>;

export const CardList = ({ isLoading = false }: CardListProps): JSX.Element => {
  const { allProvidersState } = useContext(CeramicContext);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isOpenJsonOutputModal,
    onOpen: onOpenJsonOutputModal,
    onClose: onCloseJsonOutputModal,
  } = useDisclosure();
  const btnRef = useRef();
  const [currentPlatform, setCurrentPlatform] = useState<PlatformSpec | undefined>();
  const [currentProviders, setCurrentProviders] = useState<PlatformGroupSpec[]>([]);
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
  }, [allProvidersState]);

  // Add the platforms to this switch so the sidebar content can populate dynamically
  const renderCurrentPlatformSelection = () => {
    switch (currentPlatform?.platform) {
      case "Twitter":
        return <TwitterPlatform />;
      case "Github":
        return <GithubPlatform />;
      case "Gitcoin":
        return <GitcoinPlatform />;
      case "Facebook":
        return <FacebookPlatform />;
      case "Snapshot":
        return <SnapshotPlatform />;
      case "Google":
        return <GooglePlatform />;
      case "Linkedin":
        return <LinkedinPlatform />;
      case "ETH":
        return <EthPlatform />;
      case "GitPOAP":
        return <GitPOAPPlatform />;
      case "Discord":
        return <DiscordPlatform />;
      case "POAP":
        return <PoapPlatform />;
      case "Ens":
        return <EnsPlatform />;
      case "Brightid":
        return <BrightidPlatform />;
      case "Poh":
        return <PohPlatform />;
      case "GTC":
        return <GtcPlatform />;
      case "GtcStaking":
        return <GtcStakingPlatform />;
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
    //set providers for the current platform
    if (currentPlatform) {
      setCurrentProviders(STAMP_PROVIDERS[currentPlatform.platform]);
    }
  }, [currentPlatform]);

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-wrap md:-m-4 md:px-4">
        {PLATFORMS.map((platform, i) => {
          return isLoading ? (
            <LoadingCard />
          ) : (
            <div className="w-1/2 p-2 md:w-1/2 xl:w-1/4" key={`${platform.name}${i}`}>
              <div className="relative flex h-full flex-col border border-gray-200 p-0">
                <div className="flex flex-row p-6">
                  <div className="flex h-10 w-10 flex-grow justify-center md:justify-start">
                    {platform.icon ? (
                      <img src={platform.icon} alt={platform.name} className="h-10 w-10" />
                    ) : (
                      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M24.7999 24.8002H28.7999V28.8002H24.7999V24.8002ZM14 24.8002H18V28.8002H14V24.8002ZM3.19995 24.8002H7.19995V28.8002H3.19995V24.8002ZM24.7999 14.0002H28.7999V18.0002H24.7999V14.0002ZM14 14.0002H18V18.0002H14V14.0002ZM3.19995 14.0002H7.19995V18.0002H3.19995V14.0002ZM24.7999 3.2002H28.7999V7.2002H24.7999V3.2002ZM14 3.2002H18V7.2002H14V3.2002ZM3.19995 3.2002H7.19995V7.2002H3.19995V3.2002Z"
                          fill="#161616"
                        />
                      </svg>
                    )}
                  </div>
                </div>
                <div className="flex justify-center py-0 px-6 pb-6 md:block md:justify-start">
                  <h1 className="title-font mb-0 text-lg font-medium text-gray-900 md:mb-3">{platform.name}</h1>
                  <p className="pleading-relaxed hidden md:inline-block">{platform.description}</p>
                </div>
                <div className="mt-auto">
                  {selectedProviders[platform.platform].length > 0 ? (
                    <>
                      <Menu>
                        <MenuButton className="verify-btn flex" data-testid="card-menu-button">
                          <div className="m-auto flex justify-center">
                            <svg
                              className="m-1 mr-2"
                              width="15"
                              height="16"
                              viewBox="0 0 15 16"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M0.449301 3.499C3.15674 3.46227 5.62356 2.42929 7.4998 0.75C9.37605 2.42929 11.8429 3.46227 14.5503 3.499C14.6486 4.0847 14.6998 4.68638 14.6998 5.30002C14.6998 10.0024 11.6945 14.0028 7.4998 15.4854C3.30511 14.0028 0.299805 10.0024 0.299805 5.30002C0.299805 4.68638 0.350982 4.0847 0.449301 3.499ZM10.8362 6.83638C11.1877 6.48491 11.1877 5.91506 10.8362 5.56359C10.4847 5.21212 9.91488 5.21212 9.56341 5.56359L6.5998 8.5272L5.4362 7.36359C5.08473 7.01212 4.51488 7.01212 4.16341 7.36359C3.81194 7.71506 3.81194 8.28491 4.16341 8.63638L5.96341 10.4364C6.31488 10.7879 6.88473 10.7879 7.2362 10.4364L10.8362 6.83638Z"
                                fill="#059669"
                              />
                            </svg>
                            Verified
                            <svg
                              className="relative m-1 mt-2"
                              style={{ top: "1px" }}
                              width="11"
                              height="7"
                              viewBox="0 0 11 7"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M0.292787 1.29308C0.480314 1.10561 0.734622 1.00029 0.999786 1.00029C1.26495 1.00029 1.51926 1.10561 1.70679 1.29308L4.99979 4.58608L8.29279 1.29308C8.38503 1.19757 8.49538 1.12139 8.61738 1.06898C8.73939 1.01657 8.87061 0.988985 9.00339 0.987831C9.13616 0.986677 9.26784 1.01198 9.39074 1.06226C9.51364 1.11254 9.62529 1.18679 9.71918 1.28069C9.81307 1.37458 9.88733 1.48623 9.93761 1.60913C9.98789 1.73202 10.0132 1.8637 10.012 1.99648C10.0109 2.12926 9.9833 2.26048 9.93089 2.38249C9.87848 2.50449 9.8023 2.61483 9.70679 2.70708L5.70679 6.70708C5.51926 6.89455 5.26495 6.99987 4.99979 6.99987C4.73462 6.99987 4.48031 6.89455 4.29279 6.70708L0.292787 2.70708C0.105316 2.51955 0 2.26525 0 2.00008C0 1.73492 0.105316 1.48061 0.292787 1.29308Z"
                                fill="currentColor"
                              />
                            </svg>
                          </div>
                        </MenuButton>
                        <MenuList>
                          <MenuItem onClick={onOpenJsonOutputModal} data-testid="view-json">
                            View Stamp JSON
                          </MenuItem>
                          <MenuItem
                            onClick={() => {
                              setCurrentPlatform(platform);
                              onOpen();
                            }}
                            data-testid="manage-stamp"
                          >
                            Manage stamp
                          </MenuItem>
                        </MenuList>
                      </Menu>
                      <JsonOutputModal
                        isOpen={isOpenJsonOutputModal}
                        onClose={onCloseJsonOutputModal}
                        title={`${platform.name} JSON`}
                        subheading={`You can find the ${platform.name} JSON data below`}
                        jsonOutput={selectedProviders[platform.platform].map(
                          (providerId) => allProvidersState[providerId]?.stamp?.credential
                        )}
                      />
                    </>
                  ) : (
                    <button
                      className="verify-btn"
                      ref={btnRef.current}
                      onClick={(e) => {
                        setCurrentPlatform(platform);
                        onOpen();
                      }}
                    >
                      {platform.connectMessage}
                    </button>
                  )}
                </div>
              </div>
            </div>
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
