// --- React methods
import React, { useMemo } from "react";

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
    <div className={`flex h-16 ${className}`}>
      <div className="flex items-center">
        <img className="" src={assets.gitcoinLogo} alt="Gitcoin Logo" />
        <img className="mx-3 md:mx-6" src={assets.logoLine} alt="Logo Line" />
        <img className="h-8" src={assets.passportLogo} alt="Passport Logo" />
        <div className="ml-3 text-2xl">Passport</div>
      </div>
    </div>
  );
};

export default MinimalHeader;
