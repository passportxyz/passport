import React, { useEffect, useState } from "react";
import { useRouter } from 'next/router';

// --- Chakra UI Elements
import { DrawerBody, DrawerHeader, DrawerContent, DrawerCloseButton, Switch, Spinner } from "@chakra-ui/react";

import { PlatformSpec, PlatformGroupSpec, PROVIDER_ID } from "@gitcoin/passport-platforms/dist/commonjs/types";
import { getStampProviderFilters } from "../config/filters";

export type SideBarContentProps = {
  currentPlatform: PlatformSpec | undefined;
  currentProviders: PlatformGroupSpec[] | undefined;
  verifiedProviders: PROVIDER_ID[] | undefined;
  selectedProviders: PROVIDER_ID[] | undefined;
  setSelectedProviders: React.Dispatch<React.SetStateAction<PROVIDER_ID[]>> | undefined;
  isLoading: boolean | undefined;
  verifyButton: JSX.Element | undefined;
  infoElement?: JSX.Element | undefined;
  verificationAttempted?: boolean;
};

export const SideBarContent = ({
  currentPlatform,
  currentProviders,
  verifiedProviders,
  selectedProviders,
  setSelectedProviders,
  isLoading,
  verifyButton,
  infoElement,
  verificationAttempted,
}: SideBarContentProps): JSX.Element => {
  const [allProviderIds, setAllProviderIds] = useState<PROVIDER_ID[]>([]);
  const [allSelected, setAllSelected] = useState(false);
  const [showNoStampModal, setShowNoStampModal] = useState(false);

  // stamp filter
  const router = useRouter();
  const { filter } = router.query;

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
  }, [currentProviders, selectedProviders, verificationAttempted]);

  useEffect(() => {
    if (verificationAttempted && currentPlatform?.isEVM && (selectedProviders?.length || 0) < allProviderIds.length) {
      setShowNoStampModal(true);
    }
  }, [verificationAttempted, allProviderIds, selectedProviders, currentPlatform]);

  const stampFilters = getStampProviderFilters(filter);

  return (
    <DrawerContent>
      <DrawerCloseButton disabled={isLoading} className={`z-10`} />
      {currentPlatform && currentProviders ? (
        <div className="overflow-auto">
          <DrawerHeader>
            <div className="mt-10 flex flex-col sm:flex-row">
              <div className="w-full text-center sm:py-8">
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
          <DrawerBody
            style={{ paddingInlineStart: "0", paddingInlineEnd: "0", WebkitPaddingStart: "0", WebkitPaddingEnd: "0" }}
          >
            <div>
              <div className="flex pl-4 pr-6">
                <span
                  data-testid="select-all"
                  className={`ml-auto py-2 text-sm ${
                    !allSelected ? `cursor-pointer text-purple-connectPurple` : `cursor-default `
                  } `}
                  onClick={(e) => {
                    // set the selected items by concating or filtering by providerId
                    if (!allSelected) setSelectedProviders && setSelectedProviders(!allSelected ? allProviderIds : []);
                  }}
                >
                  {allSelected ? `Selected!` : `Select all`}
                </span>
              </div>
              <hr className="border-1" />
              {/* each of the available providers in this platform */}
              {currentProviders?.map((stamp, i) => {
                // hide stamps based on filter
                const hideStamp =
                  stampFilters && !stampFilters[currentPlatform?.platform]?.includes(stamp.platformGroup);
                if (hideStamp) return null;
                return (
                  <div key={i} className="border-b py-4 px-6">
                    <p className="ml-4 text-sm font-bold">{stamp.platformGroup}</p>
                    <div className="flex flex-row justify-between">
                      <ul className="marker:leading-1 list-disc marker:text-3xl ">
                        {stamp.providers?.map((provider, i) => {
                          return (
                            <li
                              className={`ml-4 ${
                                verifiedProviders?.indexOf(provider.name as PROVIDER_ID) !== -1
                                  ? `text-green-500`
                                  : `text-gray-400`
                              }`}
                              key={`${provider.title}${i}`}
                              data-testid={`indicator-${provider.name}`}
                            >
                              <div className="relative top-[-0.3em] text-sm text-gray-400">{provider.title}</div>
                            </li>
                          );
                        })}
                      </ul>
                      <div className="align-right flex">
                        <Switch
                          colorScheme="green"
                          size="lg"
                          data-testid={`switch-${i}`}
                          isChecked={
                            stamp.providers?.reduce(
                              (isPresent, provider) =>
                                isPresent || selectedProviders?.indexOf(provider.name as PROVIDER_ID) !== -1,
                              false as boolean // typing the response - always bool
                            ) || false
                          }
                          onChange={(e) => {
                            // grab all provider_ids for this group of stamps
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
              {/* This is an optional element that can be used to provide more information */}
              {infoElement}
              <div className="pl-4 pr-4 pb-4">
                {isLoading ? (
                  <button
                    disabled
                    data-testid="button-loading-twitter"
                    className="sidebar-verify-btn mx-auto flex justify-center"
                  >
                    <Spinner size="sm" className="my-auto mr-2" />
                    {verifiedProviders!.length > 0 ? <p>Saving</p> : <p>Verifying</p>}
                  </button>
                ) : (
                  verifyButton
                )}
              </div>
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
