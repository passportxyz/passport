/* eslint-disable react-hooks/exhaustive-deps */
// --- React Methods
import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// --- Types
import { Status, Step } from "../components/Progress";
import { providers } from "@gitcoin/passport-platforms";
import { PlatformGroupSpec, PLATFORM_ID } from "@gitcoin/passport-platforms/dist/commonjs/types";
import { PlatformProps } from "../components/GenericPlatform";

// --Components
import MinimalHeader from "../components/MinimalHeader";
import PageWidthGrid, { PAGE_PADDING } from "../components/PageWidthGrid";
import HeaderContentFooterGrid from "../components/HeaderContentFooterGrid";
import PageRoot from "../components/PageRoot";
import { WelcomeBack } from "../components/WelcomeBack";
import { RefreshMyStampsModal } from "../components/RefreshMyStampsModal";
import { PossibleEVMProvider } from "../signer/utils";

// --Chakra UI Elements
import { useDisclosure } from "@chakra-ui/react";

// --- Contexts
import { CeramicContext } from "../context/ceramicContext";
import { UserContext } from "../context/userContext";
import { InitialWelcome } from "../components/InitialWelcome";

export default function Welcome() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { passport, allPlatforms } = useContext(CeramicContext);
  const { wallet, address } = useContext(UserContext);

  const navigate = useNavigate();

  // Route user to home page when wallet is disconnected
  useEffect(() => {
    if (!wallet) {
      navigate("/");
    }
  }, [wallet]);

  const initialSteps = [
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
  ];
  const [fetchedPossibleEVMStamps, setFetchedPossibleEVMStamps] = useState<PossibleEVMProvider[]>();
  const [currentSteps, setCurrentSteps] = useState<Step[]>(initialSteps);

  const resetStampsAndProgressState = () => {
    setFetchedPossibleEVMStamps([]);
    setCurrentSteps(initialSteps);
  };

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

  const fetchPossibleEVMStamps = async (
    address: string,
    allPlatforms: Map<PLATFORM_ID, PlatformProps>
  ): Promise<PossibleEVMProvider[]> => {
    try {
      const rpcUrl = process.env.NEXT_PUBLIC_PASSPORT_MAINNET_RPC_URL;

      // Extract EVM platforms
      const evmPlatforms: PlatformProps[] = [];
      const evmPlatformGroupSpecs: PlatformGroupSpec[] = [];

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
          updateSteps(1);
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
          updateSteps(2);
          return { validatedPlatformGroups, platformProps: requestedPlatform.platform };
        })
      );

      // Look for valid stamps and return the provider group if valid
      const validPlatforms = validatedPlatforms.filter((validatedPlatform) => {
        // If any of the providers in the group are valid, then the group is valid
        const validGroup = validatedPlatform.validatedPlatformGroups.filter((group) => {
          updateSteps(3);
          return (
            group.filter((provider) => {
              if (passport) {
                const stampProviders = passport.stamps.map((stamp) => stamp.provider);
                if (!stampProviders.includes(provider.providerType)) {
                  return provider.payload.valid;
                }
              }
            }).length > 0
          );
        });
        updateSteps(4);
        return validGroup.length > 0;
      });

      updateSteps(5);
      return validPlatforms;
    } catch (error) {
      console.log(error);
      throw new Error("Error: ");
    }
  };

  const handleFetchPossibleEVMStamps = async (addr: string, allPlats: Map<PLATFORM_ID, PlatformProps>) => {
    try {
      const possibleEVMStamps = await fetchPossibleEVMStamps(addr, allPlats);
      setFetchedPossibleEVMStamps(possibleEVMStamps);
      updateSteps(6);
    } catch (error) {
      throw new Error();
    }
  };

  return (
    <PageRoot className="text-color-2">
      <HeaderContentFooterGrid>
        <div className={`${PAGE_PADDING} bg-background`}>
          <MinimalHeader className={`border-b border-accent-2`} />
        </div>
        <PageWidthGrid>
          <div className="col-span-4 flex flex-col items-center text-center md:col-start-2 lg:col-start-3 xl:col-span-6 xl:col-start-4">
            {passport && passport.stamps.length > 0 ? (
              <WelcomeBack
                handleFetchPossibleEVMStamps={handleFetchPossibleEVMStamps}
                onOpen={onOpen}
                resetStampsAndProgressState={resetStampsAndProgressState}
              />
            ) : (
              <InitialWelcome
                onBoardFinished={async () => {
                  if (address) {
                    await handleFetchPossibleEVMStamps(address, allPlatforms);
                    onOpen();
                  }
                }}
              />
            )}
          </div>
        </PageWidthGrid>
      </HeaderContentFooterGrid>
      <RefreshMyStampsModal
        steps={currentSteps}
        isOpen={isOpen}
        onClose={onClose}
        fetchedPossibleEVMStamps={fetchedPossibleEVMStamps}
        resetStampsAndProgressState={resetStampsAndProgressState}
      />
    </PageRoot>
  );
}
