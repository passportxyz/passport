import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { HypercertsProvider } from "./Providers/Hypercerts";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/hypercertsStampIcon.svg",
  platform: "Hypercerts",
  name: "Hypercerts",
  description: "Connect your wallet to verify that you hold Hypercerts",
  connectMessage: "Connect Wallet",
  isEVM: true,
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Account Name",
    providers: [{ title: "Held at least two Hypercerts for more than 15 days", name: "Hypercerts" }],
  },
];

export const providers: Provider[] = [new HypercertsProvider()];
