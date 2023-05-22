import React, { useEffect, useState } from "react";

// --- Chakra UI Elements
import { DrawerBody, DrawerHeader, DrawerContent, DrawerCloseButton, Spinner } from "@chakra-ui/react";

import { PlatformSpec, PlatformGroupSpec } from "@gitcoin/passport-platforms/dist/commonjs/types";

import { PROVIDER_ID } from "@gitcoin/passport-types";

import { StampSelector } from "./StampSelector";
import { PlatformDetails } from "./PlatformDetails";
import { OnChainProvidersType } from "../context/onChainContext";

export type SideBarContentProps = {
  currentPlatform: PlatformSpec | undefined;
  currentProviders: PlatformGroupSpec[] | undefined;
  verifiedProviders: PROVIDER_ID[] | undefined;
  selectedProviders: PROVIDER_ID[] | undefined;
  setSelectedProviders: React.Dispatch<React.SetStateAction<PROVIDER_ID[]>> | undefined;
  isLoading: boolean | undefined;
  verifyButton: JSX.Element | undefined;
  infoElement?: JSX.Element | undefined;
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
}: SideBarContentProps): JSX.Element => {
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
    <DrawerContent
      style={{
        backgroundColor: "var(--color-background-2)",
        border: "1px solid var(--color-accent-2)",
        borderRadius: "6px",
      }}
    >
      <DrawerCloseButton disabled={isLoading} className={`z-10 text-color-1`} />
      {currentPlatform && currentProviders ? (
        <div className="overflow-auto">
          <DrawerHeader style={{ fontWeight: "inherit" }}>
            <PlatformDetails currentPlatform={currentPlatform!} />
          </DrawerHeader>
          <DrawerBody
            style={{
              paddingInlineStart: "0",
              paddingInlineEnd: "0",
              WebkitPaddingStart: "0",
              WebkitPaddingEnd: "0",
            }}
          >
            <div>
              <div className="flex pl-4 pr-6">
                <span
                  data-testid="select-all"
                  className={`ml-auto py-2 text-sm ${
                    !allSelected ? `cursor-pointer text-accent-3` : `cursor-default text-muted`
                  } `}
                  onClick={(e) => {
                    // set the selected items by concating or filtering by providerId
                    if (!allSelected) setSelectedProviders && setSelectedProviders(!allSelected ? allProviderIds : []);
                  }}
                >
                  {allSelected ? `Selected!` : `Select all`}
                </span>
              </div>
              <StampSelector
                currentPlatform={currentPlatform}
                currentProviders={currentProviders}
                verifiedProviders={verifiedProviders}
                selectedProviders={selectedProviders}
                setSelectedProviders={(providerIds) => setSelectedProviders && setSelectedProviders(providerIds)}
              />
              {/* This is an optional element that can be used to provide more information */}
              {infoElement}
              {verifyButton}
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
