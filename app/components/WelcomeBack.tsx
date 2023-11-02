// --- React & ReactDOM hooks
import { useContext } from "react";

// --- Types
import { PLATFORM_ID } from "@gitcoin/passport-types";
import { PlatformProps } from "../components/GenericPlatform";

// --- Contexts
import { CeramicContext } from "../context/ceramicContext";
import { useWalletStore } from "../context/walletStore";

// --- UI Components
import { WelcomeWrapper } from "./WelcomeWrapper";

export interface WelcomeBackProps {
  onOpen: () => void;
  handleFetchPossibleEVMStamps: (addr: string, allPlats: Map<PLATFORM_ID, PlatformProps>) => void;
  resetStampsAndProgressState: () => void;
  dashboardCustomizationKey: string | null;
}

export const WelcomeBack = ({
  onOpen,
  handleFetchPossibleEVMStamps,
  resetStampsAndProgressState,
  dashboardCustomizationKey,
}: WelcomeBackProps) => {
  const { allPlatforms } = useContext(CeramicContext);
  const address = useWalletStore((state) => state.address);

  return (
    <WelcomeWrapper
      content={{
        header: "Welcome back to Passport",
        subHeader: "Privacy-First Verification",
        subHeaderIconSrc: "./assets/shieldLockIcon.svg",
        buttonsConfig: {
          onSkip: () => {
            resetStampsAndProgressState();
          },
          onNext: () => {
            onOpen();
            handleFetchPossibleEVMStamps(address!, allPlatforms);
          },
          dashboardCustomizationKey: dashboardCustomizationKey,
          nextButtonText: "Refresh my stamps",
          skipButtonText: "Go to dashboard",
        },
      }}
    >
      Passport helps you collect &quot;stamps&quot; that prove your humanity and reputation. You decide what stamps are
      shown. And your privacy is protected at each step of the way.
    </WelcomeWrapper>
  );
};
