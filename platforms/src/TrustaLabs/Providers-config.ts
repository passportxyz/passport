import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { TrustaLabsProvider } from "./Providers/TrustaLabs";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/trustaLabsStampIcon.svg",
  platform: "TrustaLabs",
  name: "Trusta Labs",
  description: "Connect to Trusta Labs to verify your identity and reputation on Web3.",
  connectMessage: "Connect Account",
  website: "https://www.trustalabs.ai/",
};

export const ProviderConfig: PlatformGroupSpec[] = [
  { platformGroup: "Trusta Labs", providers: [{ title: "TrustScan Non-Sybil Account", name: "TrustaLabs" }] },
];

export const providers: Provider[] = [new TrustaLabsProvider()];
