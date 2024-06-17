// --- React methods
import React, { useMemo } from "react";
import { AccountCenter } from "./AccountCenter";
import { Notifications } from "./Notifications";

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

  return (
    <div className={`flex items-center h-16 ${className}`}>
      <div className="flex-1 flex items-center">
        <img className="" src={assets.gitcoinLogo} alt="Gitcoin Logo" />
        <img className="mx-3 md:mx-6" src={assets.logoLine} alt="Logo Line" />
        <img className="h-8" src={assets.passportLogo} alt="Passport Logo" />
        <div className="ml-3 text-2xl text-color-1">Passport</div>
      </div>
      {/* This is really just a placeholder div, because AccountCenter uses fixed positioning */}
      <div className="flex-1">
        <AccountCenter />
      </div>
    </div>
  );
};

export default MinimalHeader;
