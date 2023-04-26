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

// --Chakra UI Elements
import { useDisclosure } from "@chakra-ui/react";

// --- Contexts
import { CeramicContext, IsLoadingPassportState } from "../context/ceramicContext";
import { UserContext } from "../context/userContext";
import { InitialWelcome } from "../components/InitialWelcome";
import LoadingScreen from "../components/LoadingScreen";
import { PROVIDER_ID } from "@gitcoin/passport-types";

type ValidProvider = {
  name: PROVIDER_ID;
  title: string;
};

export type ValidPlatformGroup = {
  name: string;
  providers: ValidProvider[];
};

export type ValidPlatform = {
  name: string;
  path: string;
  groups: ValidPlatformGroup[];
};

// These are type-guarded filters which tell typescript that
// objects which pass this filter are of the defined type
const filterUndefined = <T,>(item: T | undefined): item is T => !!item;

const MIN_DELAY = 250;
const MAX_DELAY = 1000;
const getStepDelay = () => Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY + 1) + MIN_DELAY);

export default function Welcome() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { passport, allPlatforms, isLoadingPassport } = useContext(CeramicContext);
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
  const [validPlatforms, setValidPlatforms] = useState<ValidPlatform[]>();
  const [currentSteps, setCurrentSteps] = useState<Step[]>(initialSteps);

  const resetStampsAndProgressState = () => {
    setValidPlatforms([]);
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

  const fetchValidPlatforms = async (
    address: string,
    allPlatforms: Map<PLATFORM_ID, PlatformProps>
  ): Promise<ValidPlatform[]> => {
    try {
      let step = 0;
      const incrementStep = () => {
        if (step < 5) {
          updateSteps(++step);
          setTimeout(incrementStep, getStepDelay());
        }
      };
      incrementStep();

      const existingProviders = passport && passport.stamps.map((stamp) => stamp.provider);

      const rpcUrl = process.env.NEXT_PUBLIC_PASSPORT_MAINNET_RPC_URL;

      // Extract EVM platforms
      const allPlatformsData = Array.from(allPlatforms.values());
      const evmPlatforms: PlatformProps[] = allPlatformsData.filter(({ platform }) => platform.isEVM);

      const getValidGroupProviders = async (groupSpec: PlatformGroupSpec): Promise<ValidProvider[]> =>
        (
          await Promise.all(
            groupSpec.providers.map(async (provider) => {
              const { name, title } = provider;
              if (existingProviders && existingProviders.includes(name)) return;

              const payload = await providers.verify(name, { type: name, address, version: "0.0.0", rpcUrl }, {});

              if (!payload.valid) return;

              return {
                name,
                title,
              };
            })
          )
        ).filter(filterUndefined);

      const getValidPlatformGroups = async (platform: PlatformProps): Promise<ValidPlatformGroup[]> =>
        (
          await Promise.all(
            platform.platFormGroupSpec.map(async (groupSpec) => {
              const groupProviders = await getValidGroupProviders(groupSpec);
              if (groupProviders.length === 0) return;
              return {
                name: groupSpec.platformGroup,
                providers: groupProviders,
              };
            })
          )
        ).filter(filterUndefined);

      const validPlatforms: ValidPlatform[] = (
        await Promise.all(
          evmPlatforms.map(async (platform) => {
            const validPlatformGroups = await getValidPlatformGroups(platform);
            if (validPlatformGroups.length === 0) return;
            return {
              groups: validPlatformGroups,
              name: platform.platform.platformId,
              path: platform.platform.path,
            };
          })
        )
      ).filter(filterUndefined);

      step = 5;
      updateSteps(6);
      await new Promise((resolve) => setTimeout(resolve, getStepDelay()));

      return validPlatforms;
    } catch (error) {
      console.log(error);
      throw new Error("Error: ");
    }
  };

  const handleFetchPossibleEVMStamps = async (addr: string, allPlats: Map<PLATFORM_ID, PlatformProps>) => {
    try {
      const platforms = await fetchValidPlatforms(addr, allPlats);
      setValidPlatforms(platforms);
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
            {isLoadingPassport === IsLoadingPassportState.Idle ||
            isLoadingPassport === IsLoadingPassportState.FailedToConnect ? (
              passport && passport.stamps.length > 0 ? (
                <WelcomeBack
                  handleFetchPossibleEVMStamps={handleFetchPossibleEVMStamps}
                  onOpen={onOpen}
                  resetStampsAndProgressState={resetStampsAndProgressState}
                />
              ) : (
                <InitialWelcome
                  onBoardFinished={async () => {
                    if (address) {
                      handleFetchPossibleEVMStamps(address, allPlatforms);
                      onOpen();
                    }
                  }}
                />
              )
            ) : (
              <LoadingScreen />
            )}
          </div>
        </PageWidthGrid>
      </HeaderContentFooterGrid>
      <RefreshMyStampsModal
        steps={currentSteps}
        isOpen={isOpen}
        onClose={onClose}
        validPlatforms={validPlatforms}
        resetStampsAndProgressState={resetStampsAndProgressState}
      />
    </PageRoot>
  );
}
