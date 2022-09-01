import React, { useContext, useEffect, useState } from "react";

// --- Chakra UI Elements
import {
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  Switch,
} from "@chakra-ui/react";

import { PLATFORMS, PlatformSpec } from "../config/platforms";
import { PlatformGroupSpec, STAMP_PROVIDERS } from "../config/providers";
import { PROVIDER_ID } from "@gitcoin/passport-types";

import { CeramicContext } from "../context/ceramicContext";

export type SideBarContentProps = {
  currentPlatform: PlatformSpec | undefined;
  currentProviders: PlatformGroupSpec[] | undefined;
  selectedProviders: PROVIDER_ID[] | undefined;
  setSelectedProviders: React.Dispatch<React.SetStateAction<PROVIDER_ID[]>> | undefined;
  verifyButton: JSX.Element | undefined;
};

export const SideBarContent = ({
  currentPlatform,
  currentProviders,
  selectedProviders,
  setSelectedProviders,
  verifyButton,
}: SideBarContentProps): JSX.Element => {
  const { allProvidersState } = useContext(CeramicContext);
  const [allProviderIds, setAllProviderIds] = useState<PROVIDER_ID[]>([]);
  const [allSelected, setAllSelected] = useState(false);

  // alter select-all state when items change
  useEffect(() => {
    // find all providerIds
    const providerIds =
      currentProviders?.reduce((all, stamp, i) => {
        return all.concat(stamp.providers?.map((provider) => provider.name as PROVIDER_ID));
      }, [] as PROVIDER_ID[]) || [];

    // should we select or deselect?
    const doSelect = (selectedProviders?.length || 0) < providerIds.length;

    // is everything selected?
    setAllSelected(!doSelect);
    setAllProviderIds(providerIds);
  }, [currentProviders, selectedProviders]);

  return (
    <DrawerContent>
      <DrawerCloseButton />
      {currentPlatform && currentProviders ? (
        <div className="overflow-auto">
          <DrawerHeader>
            <div className="mt-10 flex flex-col sm:flex-row">
              <div className="w-full text-center sm:py-8 sm:pr-8">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-full text-gray-400">
                  <img alt="Platform Image" className="h-full w-full" src={currentPlatform?.icon} />
                </div>
                <div className="flex flex-col items-center justify-center text-center">
                  <h2 className="font-miriam-libre title-font mt-4 text-2xl font-medium text-gray-900">
                    {currentPlatform?.name}
                  </h2>
                  <p className="font-miriam-libre text-base text-gray-500">{currentPlatform?.description}</p>
                </div>
              </div>
            </div>
          </DrawerHeader>
          <DrawerBody>
            <div>
              <div className="flex">
                <button
                  className="ml-auto text-purple-connectPurple"
                  onClick={(e) => {
                    // set the selected items by concating or filtering by providerId
                    setSelectedProviders && setSelectedProviders(!allSelected ? allProviderIds : []);
                  }}
                >
                  {allSelected ? `- Remove all` : `+ Add all`}
                </button>
              </div>
              <hr className="border-1" />
              {/* each of the available providers in this platform */}
              {currentProviders?.map((stamp, i) => {
                return (
                  <div key={i} className="border-b-2 py-4">
                    <p className="font-bold">{stamp.platformGroup}</p>
                    <div className="flex flex-row justify-between">
                      <ul className="list-disc">
                        {stamp.providers?.map((provider, i) => {
                          return (
                            <li className="ml-4 mb-2 text-gray-400" key={`${provider.title}${i}`}>
                              {provider.title}
                            </li>
                          );
                        })}
                      </ul>
                      <div className="align-right flex">
                        <Switch
                          colorScheme="purple"
                          size="lg"
                          isChecked={(() => {
                            // check if any of the mentioned providers are present in allProvidersState
                            return stamp.providers?.reduce(
                              (isPresent, provider) =>
                                isPresent || selectedProviders?.indexOf(provider.name) !== -1,
                              false
                            );
                          })()}
                          onChange={(e) => {
                            // grab all provider_ids for this platform
                            const providerIds = stamp.providers?.map((provider) => provider.name as PROVIDER_ID);

                            // set the selected items by concating or filtering by providerId
                            setSelectedProviders &&
                              setSelectedProviders(
                                e.target.checked
                                  ? (selectedProviders || []).concat(providerIds)
                                  : (selectedProviders || []).filter((id) => !providerIds.includes(id))
                              );
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
              {verifyButton}
            </div>
          </DrawerBody>
        </div>
      ) : (
        <div>
          <DrawerHeader>
            <div className="mt-10 flex flex-col sm:flex-row">
              <div className="w-full text-center sm:py-8 sm:pr-8">The requested Platform or Provider was not found</div>
            </div>
          </DrawerHeader>
        </div>
      )}
    </DrawerContent>
  );
};
