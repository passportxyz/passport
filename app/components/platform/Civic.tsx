import { PlatformSpec } from "@gitcoin/passport-platforms";
import React from "react";
import { PlatformGroupCardProps } from "./index";

type CivicPassType = "CivicCaptchaPass" | "CivicUniquenessPass" | "CivicLivenessPass" | "CivicIDVPass";

const passTypeToUrl = (passType: CivicPassType) => {
  const pass = passType.toLowerCase().replace("civic", "").replace("pass", "");
  return `https://getpass.civic.com?pass=${pass}`;
};

export const PlatformGroupCard = ({ platformGroup, platform }: PlatformGroupCardProps) => {
  return (
    <div className="inline-flex">
      <img alt="Platform Image" src={platform.icon} className="m-1 h-4 w-4" />
      <a
        className="underline"
        target="_blank"
        href={passTypeToUrl(platformGroup.providers[0].name as CivicPassType)}
        rel="noreferrer"
      >
        Get Pass
      </a>
    </div>
  );
};

export const PlatformCard = ({ platform }: { platform: PlatformSpec }) => {
  return <div>{platform.name}</div>;
};
