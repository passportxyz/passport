// --- React Methods
import React, { useEffect, useRef, useState } from "react";

import { LoadingCard } from "./LoadingCard";

import { PLATFORMS, PlatformSpec } from "../config/platforms";
import { PlatformGroupSpec, STAMP_PROVIDERS } from "../config/providers";

// --- Identity Providers
import {
  GooglePlatform,
  EnsCard,
  PohCard,
  TwitterPlatform,
  PoapCard,
  FacebookPlatform,
  BrightidCard,
  GithubPlatform,
  LinkedinPlatform,
  GitcoinPlatform,
  DiscordPlatform,
  SignerCard,
  GitPOAPPlatform,
  SnapshotPlatform,
} from "./PlatformCards";
import { SideBarContent } from "./SideBarContent";

// --- Chakra UI Elements
import { Drawer, DrawerOverlay, useDisclosure } from "@chakra-ui/react";

export type CardListProps = {
  isLoading?: boolean;
};

export const CardList = ({ isLoading = false }: CardListProps): JSX.Element => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const btnRef = useRef();
  const [currentPlatform, setCurrentPlatform] = useState<PlatformSpec | undefined>();
  const [currentProviders, setCurrentProviders] = useState<PlatformGroupSpec[]>([]);

  // Add the platforms to this switch so the sidebar content can populate dynamically
  const renderCurrentPlatformSelection = () => {
    switch (currentPlatform?.name) {
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
      case "GitPOAP":
        return <GitPOAPPlatform />;
      case "Discord":
        return <DiscordPlatform />;
      default:
        return (
          <SideBarContent
            verifiedProviders={undefined}
            selectedProviders={undefined}
            setSelectedProviders={undefined}
            currentPlatform={undefined}
            currentProviders={undefined}
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
          return (
            <div className="w-1/2 p-2 md:w-1/2 xl:w-1/4" key={`${platform.name}${i}`}>
              <div className="relative border border-gray-200 p-0">
                <div className="flex flex-row p-6">
                  <div className="flex h-10 w-10 flex-grow">
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
                <div className="mt-2 p-2">
                  <h1 className="title-font mb-3 text-lg font-medium text-gray-900">{platform.name}</h1>
                  <p className="pleading-relaxed hidden md:inline-block">{platform.description}</p>
                </div>
                <button
                  className="verify-btn"
                  ref={btnRef.current}
                  onClick={(e) => {
                    // console.log(platform);
                    setCurrentPlatform(platform);
                    onOpen();
                  }}
                >
                  {platform.connectMessage}
                </button>
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
