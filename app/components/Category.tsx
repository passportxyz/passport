import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import { PLATFORMS } from "../config/platforms";
import { PlatformGroupSpec, STAMP_PROVIDERS } from "../config/providers";
import { LoadingCard } from "./LoadingCard";
import { GenericPlatform } from "./GenericPlatform";
import { PLATFORM_ID, PROVIDER_ID } from "@gitcoin/passport-types";
import { CeramicContext } from "../context/ceramicContext";
import { PlatformCard } from "./PlatformCard";
import { PlatformScoreSpec, ScorerContext } from "../context/scorerContext";
import { Disclosure } from "@headlessui/react";
import { DropDownIcon } from "./DropDownIcon";
import { SideBarContent } from "./SideBarContent";
import { Drawer, DrawerOverlay, useDisclosure } from "@chakra-ui/react";

export type Category = {
  name: string;
  description: string;
  sortedPlatforms: PlatformScoreSpec[];
};

export type CategoryProps = {
  isLoading?: boolean;
  className?: string;
  initialOpen?: boolean;
  category: Category;
};

const cardClassName = "col-span-2 md:col-span-1 lg:col-span-1 xl:col-span-1";

type SelectedProviders = Record<PLATFORM_ID, PROVIDER_ID[]>;

export const getStampProviderIds = (platform: PLATFORM_ID): PROVIDER_ID[] => {
  return (
    STAMP_PROVIDERS[platform]?.reduce((all, stamp) => {
      return all.concat(stamp.providers?.map((provider) => provider.name as PROVIDER_ID));
    }, [] as PROVIDER_ID[]) || []
  );
};

export const Category = ({
  className,
  category,
  isLoading = false,
  initialOpen = true,
}: CategoryProps): JSX.Element => {
  const { allProvidersState, allPlatforms } = useContext(CeramicContext);
  const [dropDownOpen, setDropDownOpen] = useState<boolean>(false);
  const openRef = React.useRef(dropDownOpen);
  openRef.current = dropDownOpen;

  const [panelMounted, setPanelMounted] = useState<boolean>(false);

  useEffect(() => {
    if (initialOpen) {
      handleOpen();
    }
  }, [initialOpen]);

  const handleOpen = () => {
    setPanelMounted(true);
  };

  useEffect(() => {
    setDropDownOpen(panelMounted);
  }, [panelMounted]);

  const handleClose = () => {
    setDropDownOpen(false);
    setTimeout(() => {
      const isOpen = openRef.current;
      if (!isOpen) setPanelMounted(false);
    }, 150);
  };

  const handleClick = useCallback(() => {
    if (dropDownOpen) handleClose();
    else handleOpen();
  }, [dropDownOpen]);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const btnRef = useRef();
  const [currentPlatform, setCurrentPlatform] = useState<PlatformScoreSpec | undefined>();
  const [currentProviders, setCurrentProviders] = useState<PlatformGroupSpec[]>([]);
  const [selectedProviders, setSelectedProviders] = useState<SelectedProviders>(
    PLATFORMS.reduce((platforms, platform) => {
      const providerIds = getStampProviderIds(platform.platform);
      platforms[platform.platform] = providerIds.filter(
        (providerId) => typeof allProvidersState[providerId]?.stamp?.credential !== "undefined"
      );
      return platforms;
    }, {} as SelectedProviders)
  );

  // Add the platforms to this switch so the sidebar content can populate dynamically
  let currentPlatformSelection = (
    <SideBarContent
      verifiedProviders={undefined}
      currentPlatform={undefined}
      currentProviders={undefined}
      isLoading={undefined}
      verifyButton={undefined}
      onClose={onClose}
    />
  );
  if (currentPlatform) {
    const platformProps = allPlatforms.get(currentPlatform.platform);
    if (platformProps) {
      currentPlatformSelection = (
        <GenericPlatform
          platform={platformProps.platform}
          platformScoreSpec={currentPlatform}
          platFormGroupSpec={platformProps.platFormGroupSpec}
          onClose={() => {
            setCurrentPlatform(undefined);
            onClose();
          }}
        />
      );
    }
  }

  useEffect(() => {
    // set providers for the current platform
    if (currentPlatform) {
      setCurrentProviders(STAMP_PROVIDERS[currentPlatform.platform]);
    }
  }, [currentPlatform]);

  return (
    <>
      <Disclosure as="div" className={className} defaultOpen={true} key={category.name}>
        <Disclosure.Button
          className="flex items-center border-b border-foreground-2 cursor-pointer"
          onClick={handleClick}
          as="div"
        >
          <div className="grow flex flex-col items-start mr-1">
            <div className="text-xl text-color-6 font-bold lg:text-2xl leading-none lg:leading-none text-left py-2">
              {category.name}
            </div>
          </div>
          <DropDownIcon isOpen={dropDownOpen} className="px-4" />
        </Disclosure.Button>
        {panelMounted && (
          <Disclosure.Panel className={`transition-all transit duration-150 ease-in-out my-4`} static>
            <span className="text-color-2 py-2 my-4">{category.description}</span>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 my-8">
              {category.sortedPlatforms.map((platform, i) => {
                return isLoading ? (
                  <LoadingCard key={i} className={cardClassName} />
                ) : (
                  <PlatformCard
                    i={i}
                    key={i}
                    platform={platform}
                    onOpen={onOpen}
                    selectedProviders={selectedProviders}
                    setCurrentPlatform={setCurrentPlatform}
                    className={cardClassName}
                  />
                );
              })}
            </div>
          </Disclosure.Panel>
        )}
      </Disclosure>
      {currentProviders && (
        <Drawer isOpen={isOpen} placement="right" size="sm" onClose={onClose} finalFocusRef={btnRef.current}>
          <DrawerOverlay />
          {currentPlatformSelection}
        </Drawer>
      )}
    </>
  );
};
