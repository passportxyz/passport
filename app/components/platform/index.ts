import * as Civic from "./Civic";
import { PLATFORM_ID } from "@gitcoin/passport-types";
import { PlatformGroupSpec, PlatformSpec } from "@gitcoin/passport-platforms";
import { FC } from "react";

export type PlatformCardProps = {
  platform: PlatformSpec;
};

export type PlatformGroupCardProps = {
  platformGroup: PlatformGroupSpec;
} & PlatformCardProps;

export type ProviderCards = {
  PlatformCard: FC<PlatformCardProps>;
  PlatformGroupCard: FC<PlatformGroupCardProps>;
};

export const getProviderCards = (platform: PLATFORM_ID): ProviderCards | undefined => {
  switch (platform) {
    case "Civic":
      return { PlatformCard: Civic.PlatformCard, PlatformGroupCard: Civic.PlatformGroupCard };
    default:
      return undefined;
  }
};
