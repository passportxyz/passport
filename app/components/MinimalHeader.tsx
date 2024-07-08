// --- React methods
import React, { useMemo } from "react";
import { AccountCenter } from "./AccountCenter";
import { Notifications } from "./Notifications";
import { OnchainSidebar } from "./OnchainSidebar";
import { useOneClickVerification } from "../hooks/useOneClickVerification";

type MinimalHeaderProps = {
  className?: string;
};

const getAssets = () => {
  return {
    passportLogo: "/assets/passportLogoWhite.svg",
    gitcoinLogo: "/assets/gitcoinLogoWhite.svg",
    logoLine: "/assets/logoLine.svg",
    emphasisColor: "white",
  };
};

const MinimalHeader = ({ className }: MinimalHeaderProps): JSX.Element => {
  const assets = useMemo(() => getAssets(), []);
  const [showSidebar, setShowSidebar] = React.useState(false);
  const { verificationComplete } = useOneClickVerification();

  return (
    <>
      <OnchainSidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)} />
      <div className={`flex items-center h-16 ${className}`}>
        <div className="flex-1 flex items-center">
          <img className="" src={assets.gitcoinLogo} alt="Gitcoin Logo" />
          <img className="mx-3 md:mx-6" src={assets.logoLine} alt="Logo Line" />
          <img className="h-8" src={assets.passportLogo} alt="Passport Logo" />
          <div className="ml-3 hidden md:inline-block text-2xl text-color-1">Passport</div>
        </div>
        {/* This is really just a placeholder div, because AccountCenter uses fixed positioning */}
        <div className="flex-1">
          <AccountCenter />
        </div>
        {verificationComplete && <Notifications setShowSidebar={() => setShowSidebar(true)} />}
      </div>
    </>
  );
};

export default MinimalHeader;
