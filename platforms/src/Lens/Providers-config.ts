import { PlatformSpec, PlatformGroupSpec, Provider } from "../types.js";
import { LensProfileProvider } from "./Providers/lens.js";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/lensWhiteStampIcon.svg",
  platform: "Lens",
  name: "Lens",
  description: "Connect to Lens to verify your social media presence on Web3.",
  connectMessage: "Verify Account",
  isEVM: true,
  website: "https://lens.xyz/",
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Lens Handle",
    providers: [{ title: "At least 1 Lens Handle", name: "Lens" }],
  },
];

export const providers: Provider[] = [new LensProfileProvider()];
