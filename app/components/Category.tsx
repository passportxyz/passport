import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import { PLATFORMS } from "../config/platforms";
import { PlatformGroupSpec, STAMP_PROVIDERS, customStampProviders, getStampProviderIds } from "../config/providers";
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
import { isDynamicCustomization } from "../utils/customizationUtils";
import { useCustomization } from "../hooks/useCustomization";

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
  const customization = useCustomization();

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

  const [currentPlatform, setCurrentPlatform] = useState<PlatformScoreSpec | undefined>();

  const platformProps = currentPlatform?.platform && allPlatforms.get(currentPlatform.platform);

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 my-8">
              {category.sortedPlatforms.map((platform, i) => {
                return isLoading ? (
                  <LoadingCard key={i} className={cardClassName} />
                ) : (
                  <PlatformCard
                    i={i}
                    key={i}
                    platform={platform}
                    onOpen={onOpen}
                    setCurrentPlatform={setCurrentPlatform}
                    className={cardClassName}
                  />
                );
              })}
            </div>
          </Disclosure.Panel>
        )}
      </Disclosure>
      {platformProps && currentPlatform && (
        <GenericPlatform
          platform={platformProps.platform}
          platformScoreSpec={currentPlatform}
          platFormGroupSpec={platformProps.platFormGroupSpec}
          isOpen={isOpen}
          onClose={() => {
            setCurrentPlatform(undefined);
            onClose();
          }}
        />
      )}
    </>
  );
};
