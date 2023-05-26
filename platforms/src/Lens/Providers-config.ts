import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { LensProfileProvider } from "./Providers/lens";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/lensWhiteStampIcon.svg",
  platform: "Lens",
  name: "Lens",
  description: "Lens Profile Verification",
  connectMessage: "Verify Account",
  isEVM: true,
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Lens Handle",
    providers: [{ title: "At least 1 Lens Handle", name: "Lens" }],
  },
];

export const providers: Provider[] = [new LensProfileProvider()];
