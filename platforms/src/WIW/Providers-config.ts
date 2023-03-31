import { PlatformSpec, PlatformGroupSpec } from "../types";
import { BADGE_COUNT_GTE_THRESHOLD } from "./Providers";

export const WIWPlatformDetails: PlatformSpec = {
  icon: "./assets/wiwStampIcon.svg",
  platform: "WIW",
  name: "WIW",
  description: "WIW Verification",
  connectMessage: "Verify Account",
  isEVM: true,
};

export const WIWProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "WIW Badges Amount",
    providers: [{ title: `At least ${BADGE_COUNT_GTE_THRESHOLD} WIW Badges`, name: "WIWBadgeProvider" }],
  },
];
