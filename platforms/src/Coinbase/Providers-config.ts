import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { CoinbaseProvider } from "./Providers/coinbase";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/coinbaseStampIcon.svg",
  platform: "Coinbase",
  name: "Coinbase",
  description: "Connect your existing account to verify with Coinbase.",
  connectMessage: "Connect Account",
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Account Name",
    providers: [{ title: "Encrypted", name: "Coinbase" }],
  },
];

export const providers: Provider[] = [new CoinbaseProvider()];
