// --- React & ReactDOM hooks
import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

// --- Types
import { PLATFORM_ID } from "@gitcoin/passport-types";
import { PlatformProps } from "../components/GenericPlatform";

// --- Contexts
import { CeramicContext } from "../context/ceramicContext";
import { UserContext } from "../context/userContext";

// --- UI Components
import { WelcomeWrapper } from "./WelcomeWrapper";
import { Button } from "./Button";
import { LoadButton } from "./LoadButton";

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
  const { address } = useContext(UserContext);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  return (
    <WelcomeWrapper
      content={{
        header: "Welcome Back!",
        subHeader: "One-Click Verification",
        body: "You can now verify most web3 stamps and return to your destination faster with one-click verification!",
        imgSrc: "./assets/welcome-back.png",
      }}
    >
      <div className="grid w-full grid-cols-2 gap-4">
        <LoadButton
          data-testid="skip-for-now-button"
          variant="secondary"
          isLoading={isLoading}
          onClick={() => {
            setIsLoading(true);
            navigate(`/dashboard${dashboardCustomizationKey ? `/${dashboardCustomizationKey}` : ""}`);
            resetStampsAndProgressState();
            setIsLoading(false);
          }}
        >
          Skip For Now
        </LoadButton>
        <Button
          data-testid="refresh-my-stamps-button"
          onClick={() => {
            onOpen();
            handleFetchPossibleEVMStamps(address!, allPlatforms);
          }}
        >
          Refresh My Stamps
        </Button>
      </div>
    </WelcomeWrapper>
  );
};
