import { PlatformSpec } from "@gitcoin/passport-platforms";
import React, { useContext } from "react";
import { getPlatformSpec } from "../config/platforms";
import { CeramicContext } from "../context/ceramicContext";
import InitiateReverifyStampsButton from "./InitiateReverifyStampsButton";

type StampsListProps = {
  className?: string;
};

const ExpiredStampsList = ({ className }: StampsListProps) => {
  const { expiredPlatforms } = useContext(CeramicContext);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className={`flex flex-wrap justify-center gap-8`}>
        {expiredPlatforms
          ? Object.values(expiredPlatforms)
              .map((platform) => getPlatformSpec(platform.platform.platformId))
              .filter((platformSpec): platformSpec is PlatformSpec => !!platformSpec)
              .map((platformSpec) => {
                // check if platform has onchain providers
                return (
                  <div key={platformSpec.platform} className="flex flex-col items-center">
                    <img alt="Platform Icon" src={platformSpec.icon} className="col-start-1 row-start-1 h-8 w-8" />
                  </div>
                );
              })
          : null}
      </div>
    </div>
  );
};

export const ExpiredStampsPanel = ({ className }: { className: string }) => {
  const { expiredProviders } = useContext(CeramicContext);

  return (
    <div
      className={`flex flex-col items-center rounded border border-foreground-3 bg-gradient-to-b from-background to-background-2 text-xl text-foreground-2 ${className}`}
    >
      <div className="my-2">Expired Stamps</div>
      <div className="h-[2px] w-full bg-gradient-to-r from-background via-foreground-2 to-background" />

      <ExpiredStampsList className="m-6" />
      {expiredProviders.length > 0 ? (
        <InitiateReverifyStampsButton className="mb-10" />
      ) : (
        <p className="mb-10">You don&apos;t have any expired stamps</p>
      )}
    </div>
  );
};
