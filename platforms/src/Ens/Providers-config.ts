import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { EnsProvider } from "./Providers";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/ensStampIcon.svg",
  platform: "Ens",
  name: "ENS",
  description: "Purchase an .eth name to verify/ connect your existing account.",
  connectMessage: "Connect Account",
  isEVM: true,
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Account Name",
    providers: [{ title: "Encrypted", name: "Ens" }],
  },
];

export const providers: Provider[] = [new EnsProvider()];
