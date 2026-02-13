import React, { useCallback, useContext, useEffect, useState } from "react";
import { LoadingCard } from "./LoadingCard";
import { GenericPlatform } from "./GenericPlatform";
import { CeramicContext } from "../context/ceramicContext";
import { PlatformCard } from "./PlatformCard";
import { PlatformScoreSpec } from "../context/scorerContext";
import { Disclosure } from "@headlessui/react";
import { DropDownIcon } from "./DropDownIcon";
import { useDisclosure } from "@chakra-ui/react";

export type Category = {
  name: string;
  icon?: React.ReactElement;
  id?: string;
  description: string;
  sortedPlatforms: PlatformScoreSpec[];
};

export type CategoryProps = {
  isLoading?: boolean;
  className?: string;
  initialOpen?: boolean;
  category: Category;
};

export const CUSTOM_CATEGORY_ID = "Custom";

// const cardClassName = "col-span-2 md:col-span-1 lg:col-span-1 xl:col-span-1 bg-background";
const cardClassName = "";

export const Category = ({
  className,
  category,
  isLoading = false,
  initialOpen = true,
}: CategoryProps): JSX.Element => {
  const { allPlatforms } = useContext(CeramicContext);
  const [dropDownOpen, setDropDownOpen] = useState<boolean>(false);
  const openRef = React.useRef(dropDownOpen);
  openRef.current = dropDownOpen;

  const [panelMounted, setPanelMounted] = useState<boolean>(false);

  useEffect(() => {
    // Emit resize event when panel is mounted or unmounted,
    // to ensure that the layout is resized correctly
    window.dispatchEvent(new Event("resize"));
  }, [panelMounted]);

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
      <Disclosure
        as="div"
        className="col-span-full p-2 md:p-8 bg-white rounded-xl"
        defaultOpen={true}
        key={category.name}
      >
        <Disclosure.Button className="flex items-center cursor-pointer" onClick={handleClick} as="div">
          <div className="flex grow">
            <div className="pr-4 flex-none">{category.icon}</div>
            <div className="grow flex flex-col items-start mr-1">
              <div className="text-xl text-gray-800 lg:text-2xl leading-none lg:leading-none text-left py-2">
                {category.name}
              </div>
              <div className="text-xl text-black lg:text-xl leading-none lg:leading-none text-left py-2">
                <span className="text-gray-600 py-2 my-4">{category.description}</span>
              </div>
            </div>
            <div className="flex flex-col justify-center">
              <DropDownIcon isOpen={dropDownOpen} className="flex-none px-4" />
            </div>
          </div>
        </Disclosure.Button>
        {panelMounted && (
          <Disclosure.Panel className={`transition-all transit duration-150 ease-in-out my-4`} static>
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
          isEVM={platformProps.isEVM}
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
