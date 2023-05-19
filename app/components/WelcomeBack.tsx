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
import { Spinner } from "@chakra-ui/react";
import { WelcomeWrapper } from "./WelcomeWrapper";
import Button from "./Button";

export interface WelcomeBackProps {
  onOpen: () => void;
  handleFetchPossibleEVMStamps: (addr: string, allPlats: Map<PLATFORM_ID, PlatformProps>) => void;
  resetStampsAndProgressState: () => void;
}

export const WelcomeBack = ({
  onOpen,
  handleFetchPossibleEVMStamps,
  resetStampsAndProgressState,
}: WelcomeBackProps) => {
  const { allPlatforms } = useContext(CeramicContext);
  const { address } = useContext(UserContext);
  const navigate = useNavigate();
  const [isLoading, setLoading] = useState(false);

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
        <Button
          data-testid="skip-for-now-button"
          variant="secondary"
          onClick={() => {
            setLoading(true);
            navigate("/dashboard");
            resetStampsAndProgressState();
            setLoading(false);
          }}
        >
          Skip For Now
          {isLoading ? <Spinner size="sm" className="my-auto ml-2" /> : <></>}
        </Button>
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
