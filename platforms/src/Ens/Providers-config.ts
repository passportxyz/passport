import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { EnsProvider } from "./Providers";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/ensStampIcon.svg",
  platform: "Ens",
  name: "ENS",
  description: "Connect to ENS to verify your ownership of your web3 domain name.",
  connectMessage: "Connect Account",
  isEVM: true,
  website: "https://ens.domains/",
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Account Name",
    providers: [{ title: "Encrypted", name: "Ens" }],
  },
];

export const providers: Provider[] = [new EnsProvider()];
