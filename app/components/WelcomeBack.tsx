// --- React & ReactDOM hooks
import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

// --- Types
import { PLATFORM_ID } from "@gitcoin/passport-platforms/dist/commonjs/types";
import { PlatformProps } from "../components/GenericPlatform";

// --- Contexts
import { CeramicContext } from "../context/ceramicContext";
import { UserContext } from "../context/userContext";

// --- UI Components
import { Spinner } from "@chakra-ui/react";

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
    <>
      <div className="top-[113px] mt-10 text-3xl">Welcome Back!</div>
      <div className="top-[209px] mt-10 h-[240px] w-[295px] border border-accent-2 bg-background lg:h-[333.56px] lg:w-[410px]"></div>
      <p className="top-[113px] mt-10 text-2xl text-muted">One-Click Verification</p>
      <p className="mt-2 mb-10 w-[343px] text-gray-300 lg:w-[410px]">
        You can now verify most web3 stamps and return to your destination faster with one-click verification!
      </p>
      <div className="absolute bottom-10 mb-auto flex w-[295px] items-center justify-between md:relative md:mt-16 lg:w-[410px]">
        <button
          data-testid="skip-for-now-button"
          className="secondary-btn mr-2 flex w-full items-center justify-center rounded-sm py-2 px-6"
          onClick={() => {
            setLoading(true);
            navigate("/dashboard");
            resetStampsAndProgressState();
            setLoading(false);
          }}
        >
          Skip For Now
          {isLoading ? <Spinner size="sm" className="my-auto ml-2" /> : <></>}
        </button>
        <button
          data-testid="refresh-my-stamps-button"
          className="ml-2 w-full rounded-sm bg-accent py-2 px-6"
          onClick={() => {
            onOpen();
            handleFetchPossibleEVMStamps(address!, allPlatforms);
          }}
        >
          Refresh My Stamps
        </button>
      </div>
    </>
  );
};
