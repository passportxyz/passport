import { PlatformSpec, PlatformGroupSpec } from "../types";

export const LensPlatformDetails: PlatformSpec = {
  icon: "./assets/lensStampIcon.svg",
  platform: "Lens",
  name: "Lens",
  description: "Lens Profile Verification",
  connectMessage: "Verify Account",
  isEVM: true,
};

export const LensProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Lens Handle",
    providers: [{ title: "At least 1 Lens Handle", name: "Lens" }],
  },
];
