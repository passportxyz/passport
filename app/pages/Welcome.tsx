/* eslint-disable react-hooks/exhaustive-deps */
// --- React Methods
import React, { useContext, useState, useEffect } from "react";

// --- Types
import { Status, Step } from "../components/Progress";
import { PLATFORM_ID } from "@gitcoin/passport-types";
import { PlatformProps } from "../components/GenericPlatform";

// --Components
import MinimalHeader from "../components/MinimalHeader";
import { PAGE_PADDING } from "../components/PageWidthGrid";
import HeaderContentFooterGrid from "../components/HeaderContentFooterGrid";
import PageRoot from "../components/PageRoot";
import { WelcomeBack } from "../components/WelcomeBack";
import { RefreshMyStampsModal } from "../components/RefreshMyStampsModal";

// --Chakra UI Elements
import { useDisclosure } from "@chakra-ui/react";

// --- Contexts
import { CeramicContext, IsLoadingPassportState } from "../context/ceramicContext";
import { useWalletStore } from "../context/walletStore";
import { InitialWelcome } from "../components/InitialWelcome";
import LoadingScreen from "../components/LoadingScreen";

// --- Utils
import { fetchPossibleEVMStamps, ValidatedPlatform } from "../signer/utils";
import BodyWrapper from "../components/BodyWrapper";
import { useDatastoreConnectionContext } from "../context/datastoreConnectionContext";
import { useNavigateToPage } from "../hooks/useCustomization";

const MIN_DELAY = 50;
const MAX_DELAY = 800;
const getStepDelay = () => Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY + 1) + MIN_DELAY);

export default function Welcome() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { passport, allPlatforms, isLoadingPassport } = useContext(CeramicContext);
  const { dbAccessTokenStatus } = useDatastoreConnectionContext();
  const address = useWalletStore((state) => state.address);

  const navigateToPage = useNavigateToPage();

  // Route user to home page when wallet is disconnected
  useEffect(() => {
    if (!address) {
      navigateToPage("home");
    }
  }, [address]);

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
  const [validPlatforms, setValidPlatforms] = useState<ValidatedPlatform[]>();
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
  ): Promise<ValidatedPlatform[]> => {
    try {
      let step = 0;
      const incrementStep = () => {
        if (step < 4) {
          updateSteps(++step);
          setTimeout(incrementStep, getStepDelay());
        }
      };
      incrementStep();

      const validPlatforms = await fetchPossibleEVMStamps(address, allPlatforms, passport);

      step = 5;
      updateSteps(6);
      await new Promise((resolve) => setTimeout(resolve, 300));

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
      console.log(error);
      throw new Error();
    }
  };
  console.log("LARISA passport : ", passport)
  return (
    <PageRoot className="text-color-2">
      <HeaderContentFooterGrid>
        <div className={`${PAGE_PADDING} bg-background`}>
          <MinimalHeader className={`border-b border-foreground-6`} />
        </div>
        <BodyWrapper className="flex justify-center">
          {(isLoadingPassport === IsLoadingPassportState.Idle ||
            isLoadingPassport === IsLoadingPassportState.FailedToConnect) &&
            dbAccessTokenStatus === "connected" ?  (
            passport && passport.stamps.length > 0 ? (
              // if user did not skip it before
              <InitialWelcome
              onBoardFinished={async () => {
                if (address) {
                  handleFetchPossibleEVMStamps(address, allPlatforms);
                  onOpen();
                }
              }}
              hasPassports={true}
            />

            ) : (
              <InitialWelcome
                onBoardFinished={async () => {
                  if (address) {
                    handleFetchPossibleEVMStamps(address, allPlatforms);
                    onOpen();
                  }
                }}
                hasPassports={true}
              />
            )
          ) : (
            <LoadingScreen />
          )}
        </BodyWrapper>
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
