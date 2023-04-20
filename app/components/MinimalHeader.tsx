// --- React methods
import React, { useMemo } from "react";

type MinimalHeaderProps = {
  className?: string;
};

const getAssets = () => {
  return {
    passportLogo: "/assets/passportLogoWhite.svg",
    gitcoinLogo: "/assets/gitcoinLogoWhite.svg",
    passportWord: "/assets/passportWordWhite.svg",
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
        <img className="" src={assets.passportLogo} alt="Passport Logo" />
        <img className="mx-3 hidden md:block" src={assets.passportWord} alt="Scorer" />
      </div>
    </div>
  );
};

export default MinimalHeader;
