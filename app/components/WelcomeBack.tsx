import { useContext } from "react";
import { useNavigate } from "react-router-dom";

import { PLATFORM_ID } from "@gitcoin/passport-platforms/dist/commonjs/types";
import { PlatformProps } from "../components/GenericPlatform";

import { CeramicContext, IsLoadingPassportState } from "../context/ceramicContext";
import { UserContext } from "../context/userContext";

interface WelcomeBackProps {
  setSkipForNow: (skipForNow: boolean) => void;
  onOpen: () => void;
  handleFetchPossibleEVMStamps: (addr: string, allPlats: Map<PLATFORM_ID, PlatformProps>) => void;
}

export const WelcomeBack = ({ setSkipForNow, onOpen, handleFetchPossibleEVMStamps }: WelcomeBackProps) => {
  const { allPlatforms } = useContext(CeramicContext);
  const { address } = useContext(UserContext);
  const navigate = useNavigate();

  return (
    <>
      <div className="top-[113px] mt-10 text-3xl">Welcome Back!</div>
      <div className="top-[209px] mt-10 h-[240px] w-[295px] border border-accent-2 bg-background lg:h-[333.56px] lg:w-[410px]"></div>
      <p className="top-[113px] mt-10 text-2xl text-muted">One-Click Verification</p>
      <p className="mt-2 w-[343px] text-gray-300 lg:w-[410px]">
        You can now verify most web3 stamps and return to your destination faster with one-click verification!
      </p>
      <div className="mt-16 flex w-[295px] content-center items-center justify-between lg:w-[410px]">
        <button className="secondary-btn mr-2 w-full rounded-sm py-2 px-6" onClick={() => navigate("/dashboard")}>
          Skip For Now
        </button>
        <button
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
