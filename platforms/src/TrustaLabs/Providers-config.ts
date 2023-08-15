import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { TrustaLabsProvider } from "./Providers/TrustaLabs";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/trustalabsStampIcon.svg",
  platform: "TrustaLabs",
  name: "Trusta Labs",
  description: "Connect your existing TrustaLabs Account to verify",
  connectMessage: "Connect Account",
};

export const ProviderConfig: PlatformGroupSpec[] = [
  { platformGroup: "Trusta Labs", providers: [{ title: "Sybil Score", name: "TrustaLabs" }] },
];

export const providers: Provider[] = [new TrustaLabsProvider()];
