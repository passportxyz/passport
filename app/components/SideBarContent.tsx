import React, { useContext, useEffect, useState } from "react";

// --- Chakra UI Elements
import { DrawerBody, DrawerHeader, DrawerContent, DrawerCloseButton, useDisclosure } from "@chakra-ui/react";

import { PlatformGroupSpec, PlatformBanner } from "@gitcoin/passport-platforms";

import { PLATFORM_ID, PROVIDER_ID } from "@gitcoin/passport-types";

import { StampSelector } from "./StampSelector";
import { Button } from "./Button";
import { PlatformDetails } from "./PlatformDetails";
import { PlatformScoreSpec } from "../context/scorerContext";
import { RemoveStampModal } from "./RemoveStampModal";
import { STAMP_PROVIDERS } from "../config/providers";
import { CeramicContext } from "../context/ceramicContext";
import Checkbox from "./Checkbox";

export type SideBarContentProps = {
  currentPlatform: PlatformScoreSpec | undefined;
  currentProviders: PlatformGroupSpec[] | undefined;
  verifiedProviders: PROVIDER_ID[] | undefined;
  selectedProviders: PROVIDER_ID[] | undefined;
  setSelectedProviders: React.Dispatch<React.SetStateAction<PROVIDER_ID[]>> | undefined;
  isLoading: boolean | undefined;
  verifyButton: JSX.Element | undefined;
  onClose: () => void;
  bannerConfig?: PlatformBanner;
};

export const SideBarContent = ({
  onClose,
  currentPlatform,
  currentProviders,
  verifiedProviders,
  selectedProviders,
  setSelectedProviders,
  isLoading,
  verifyButton,
  bannerConfig,
}: SideBarContentProps): JSX.Element => {
  const { handleDeleteStamps } = useContext(CeramicContext);
  const [allProviderIds, setAllProviderIds] = useState<PROVIDER_ID[]>([]);
  const [allSelected, setAllSelected] = useState(false);

  const {
    isOpen: isOpenRemoveStampModal,
    onOpen: onOpenRemoveStampModal,
    onClose: onCloseRemoveStampModal,
  } = useDisclosure();

  const onRemoveStamps = async () => {
    await handleDeleteStamps(allProviderIds);
    onClose();
  };

  // alter select-all state when items change
  useEffect(() => {
    // find all providerIds
    const providerIds =
      currentProviders?.reduce((all, stamp) => {
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
        backgroundColor: "rgb(var(--color-background))",
        border: "1px solid rgb(var(--color-foreground-5))",
        borderRadius: "6px",
        backgroundImage: "url('/assets/sidebarHeader.svg')",
        backgroundRepeat: "no-repeat",
      }}
    >
      <DrawerCloseButton disabled={isLoading} className={`visible z-10 text-color-1 md:invisible`} />
      {currentPlatform && currentProviders ? (
        <div className="overflow-auto p-10 text-color-1">
          <DrawerHeader
            style={{
              fontWeight: "inherit",
              padding: "0",
            }}
          >
            <PlatformDetails
              currentPlatform={currentPlatform}
              bannerConfig={bannerConfig}
              verifiedProviders={verifiedProviders}
            />
          </DrawerHeader>
          <DrawerBody
            style={{
              padding: "0",
            }}
          >
            <div>
              <div className="mt-8 flex">
                <Checkbox
                  id="select-all"
                  checked={allSelected}
                  onChange={(checked) => setSelectedProviders && setSelectedProviders(checked ? allProviderIds : [])}
                />

                <label htmlFor="select-all" data-testid="select-all" className={`pl-2 font-alt text-sm`}>
                  Select all
                </label>
              </div>
              <hr className="mt-4 border-foreground-3" />
              <StampSelector
                currentPlatform={currentPlatform}
                currentProviders={currentProviders}
                verifiedProviders={verifiedProviders}
                selectedProviders={selectedProviders}
                setSelectedProviders={(providerIds) => setSelectedProviders && setSelectedProviders(providerIds)}
              />
              {verifyButton}
              <div className="mt-4 flex justify-center">
                <button
                  className="bg-background text-color-2 disabled:cursor-not-allowed disabled:brightness-50"
                  disabled={!verifiedProviders || verifiedProviders?.length === 0}
                  onClick={onOpenRemoveStampModal}
                  data-testid="remove-stamp"
                >
                  Remove
                </button>
              </div>
            </div>
          </DrawerBody>
          <RemoveStampModal
            isOpen={isOpenRemoveStampModal}
            onClose={onCloseRemoveStampModal}
            title={`Remove ${currentPlatform.name} Stamp`}
            body={"This stamp will be removed from your Passport. You can still re-verify your stamp in the future."}
            stampsToBeDeleted={
              STAMP_PROVIDERS[currentPlatform.platform]?.reduce((all, stamp) => {
                return all.concat(stamp.providers?.map((provider) => provider.name as PROVIDER_ID));
              }, [] as PROVIDER_ID[]) || []
            }
            handleDeleteStamps={onRemoveStamps}
            platformId={currentPlatform.name as PLATFORM_ID}
          />
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
