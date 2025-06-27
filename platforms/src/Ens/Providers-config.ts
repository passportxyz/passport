import { PlatformSpec, PlatformGroupSpec, Provider } from "../types.js";
import { EnsProvider } from "./Providers/index.js";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/ensStampIcon.svg",
  platform: "Ens",
  name: "ENS",
  description: "Verify ownership of your ENS domain",
  connectMessage: "Connect Account",
  isEVM: true,
  website: "https://ens.domains/",
  timeToGet: "5 minutes",
  price: "Variable",
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Domain Verification",
    providers: [
      {
        title: "ENS Domain Owner",
        description: "Owned and configured an ENS domain as primary name, establishing decentralized identity",
        name: "Ens",
      },
    ],
  },
];

export const providers: Provider[] = [new EnsProvider()];
