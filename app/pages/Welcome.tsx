/* eslint-disable react-hooks/exhaustive-deps */
// --- React Methods
import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { providers } from "@gitcoin/passport-platforms";
import { PlatformGroupSpec, PLATFORM_ID } from "@gitcoin/passport-platforms/dist/commonjs/types";
import { PlatformProps } from "../components/GenericPlatform";

import { Status, Step } from "../components/Progress";

// --Components
import MinimalHeader from "../components/MinimalHeader";
import PageWidthGrid, { PAGE_PADDING } from "../components/PageWidthGrid";
import HeaderContentFooterGrid from "../components/HeaderContentFooterGrid";
import { WelcomeBack } from "../components/WelcomeBack";
import PageRoot from "../components/PageRoot";

// --Chakra UI Elements
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalOverlay,
  Spinner,
  useDisclosure,
} from "@chakra-ui/react";

import { CeramicContext, IsLoadingPassportState } from "../context/ceramicContext";
import { UserContext } from "../context/userContext";

import { RefreshMyStampsModal } from "../components/RefreshMyStampsModal";
import { PossibleEVMProvider } from "../signer/utils";

export default function Welcome() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { allPlatforms, passport } = useContext(CeramicContext);
  const { address } = useContext(UserContext);
  const [skipForNow, setSkipForNow] = useState(false);
  const navigate = useNavigate();

  console.log(passport);

  const [fetchedPossibleEVMStamps, setFetchedPossibleEVMStamps] = useState<PossibleEVMProvider[]>();
  const [currentSteps, setCurrentSteps] = useState<Step[]>([
    {
      name: "Scanning",
      status: Status.SUCCESS,
    },
    {
      name: "Double Checking",
      status: Status.NOT_STARTED,
    },
    {
      name: "Validating",
      status: Status.NOT_STARTED,
    },
    {
      name: "Brewing Coffee",
      status: Status.NOT_STARTED,
    },
    {
      name: "Almost there",
      status: Status.NOT_STARTED,
    },
    {
      name: "Ready for review",
      status: Status.NOT_STARTED,
    },
  ]);

  // TODO: Add reset state if user clicks "cancel" or "skip for now"
  const updateSteps = (activeStepIndex: number, error?: boolean) => {
    // if error mark ActiveStep as ERROR, and previous steps as SUCCESS
    const steps = [...currentSteps];
    if (error) {
      steps.slice(0, activeStepIndex).forEach((step) => (step.status = Status.SUCCESS));
      steps[activeStepIndex - 1].status = Status.ERROR;
      setCurrentSteps(steps);
      return;
    }
    // if there is no error mark previous steps as SUCCESS, mark step after activeStepIndex as IS_STARTED
    steps.slice(0, activeStepIndex).forEach((step) => (step.status = Status.SUCCESS));
    if (steps[activeStepIndex]) {
      steps[activeStepIndex].status = Status.IN_PROGRESS;
    }

    setCurrentSteps(steps);
  };

  // TODO: add error handling
  const fetchPossibleEVMStamps = async (
    address: string,
    allPlatforms: Map<PLATFORM_ID, PlatformProps>
  ): Promise<PossibleEVMProvider[]> => {
    const rpcUrl = process.env.NEXT_PUBLIC_PASSPORT_MAINNET_RPC_URL;

    // Extract EVM platforms
    const evmPlatforms: PlatformProps[] = [];
    const evmPlatformGroupSpecs: PlatformGroupSpec[] = [];

    updateSteps(1);
    allPlatforms.forEach((value, key, map) => {
      const platformProp = map.get(key);
      if (platformProp?.platform.isEVM) {
        evmPlatformGroupSpecs.push(...platformProp.platFormGroupSpec);
        evmPlatforms.push(platformProp);
      }
    });
    // Build requests for each verify function within every EVM Provider
    const providerRequests = await Promise.all(
      evmPlatforms.map((platform) => {
        const validatedProviderGroup = platform.platFormGroupSpec.map((groupSpec) => {
          return groupSpec.providers.map(async (provider) => {
            const payload = await providers.verify(
              provider.name,
              { type: provider.name, address, version: "0.0.0", rpcUrl },
              {}
            );
            return {
              payload,
              providerType: provider.name,
            };
          });
        });
        updateSteps(2);
        return { validatedProviderGroup, platform };
      })
    );

    // Resolve nested promises
    const validatedPlatforms = await Promise.all(
      providerRequests.map(async (requestedPlatform) => {
        const validatedPlatformGroups = await Promise.all(
          requestedPlatform.validatedProviderGroup.map(async (group) => {
            const validatedProviders = await Promise.all(group);
            return validatedProviders;
          })
        );
        updateSteps(3);
        return { validatedPlatformGroups, platformProps: requestedPlatform.platform };
      })
    );

    // Look for valid stamps and return the provider group if valid
    const validPlatforms = validatedPlatforms.filter((validatedPlatform) => {
      // If any of the providers in the group are valid, then the group is valid
      const validGroup = validatedPlatform.validatedPlatformGroups.filter((group) => {
        return (
          group.filter((provider) => {
            return provider.payload.valid;
          }).length > 0
        );
      });
      updateSteps(4);
      return validGroup.length > 0;
    });

    // if it's already in their passport, filter it out
    const validPlatformsNotInPassport = () => {
      if (passport) {
        passport.stamps.map((stamp) => {
          validPlatforms.map((validPlatform) => {
            validPlatform.validatedPlatformGroups.map((validatedPlatformGroup) => {
              console.log("validatedPlatformGroup", validatedPlatformGroup);
            });
            // validPlatforms
            // -- validatedPlatformGroups is a nested object with arrays, 1 or more
            // ----
            // if the platform contains any of the providers, then filter that validPlatorm out
            console.log("stamp", stamp);
            console.log("validPlatform", validPlatform);
            // return stamp !== validPlatform
          });
        });
      }
    };
    validPlatformsNotInPassport();
    updateSteps(5);
    return validPlatforms;
  };

  const handleFetchPossibleEVMStamps = async (addr: string, allPlats: Map<PLATFORM_ID, PlatformProps>) => {
    const possibleEVMStamps = await fetchPossibleEVMStamps(addr, allPlats);
    setFetchedPossibleEVMStamps(possibleEVMStamps);
    updateSteps(6);
  };

  return (
    <PageRoot className="text-color-2">
      <HeaderContentFooterGrid>
        <div className={`${PAGE_PADDING} bg-background`}>
          <MinimalHeader className={`border-b border-accent-2`} />
        </div>
        <PageWidthGrid>
          <div className="col-span-4 flex flex-col items-center text-center md:col-start-2 lg:col-start-3 xl:col-span-6 xl:col-start-4">
            {/* if connected wallet address has a passport, show the Welcome Back component */}
            <WelcomeBack
              handleFetchPossibleEVMStamps={handleFetchPossibleEVMStamps}
              setSkipForNow={setSkipForNow}
              onOpen={onOpen}
            />
            {/* otherwise, show the First Time Welcome component */}
          </div>
        </PageWidthGrid>
      </HeaderContentFooterGrid>
      <RefreshMyStampsModal
        steps={currentSteps}
        isOpen={isOpen}
        onClose={onClose}
        fetchedPossibleEVMStamps={fetchedPossibleEVMStamps}
      />
    </PageRoot>
  );
}
