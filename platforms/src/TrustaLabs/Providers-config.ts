import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { TrustaLabsProvider } from "./Providers/TrustaLabs";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/trustaLabsStampIcon.svg",
  platform: "TrustaLabs",
  name: "Trusta Labs",
  description: "Launch Trusta's TrustScan to verify this account has non-Sybil behavior",
  connectMessage: "Connect Account",
  website: "https://www.trustalabs.ai/",
};

export const ProviderConfig: PlatformGroupSpec[] = [
  { platformGroup: "Trusta Labs", providers: [{ title: "TrustScan Non-Sybil Account", name: "TrustaLabs" }] },
];

export const providers: Provider[] = [new TrustaLabsProvider()];
