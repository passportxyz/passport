import { PlatformSpec, PlatformGroupSpec } from "../types";

export const GitPOAPPlatformDetails: PlatformSpec = {
  icon: "./assets/gitPOAPStampIcon.svg",
  platform: "GitPOAP",
  name: "GitPOAP",
  description: "GitPOAP Verification",
  connectMessage: "Connect Account",
};

export const GitPOAPProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Account Name",
    providers: [{ title: "Encrypted", name: "GitPOAP" }],
  },
];
