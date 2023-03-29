import { PlatformSpec, PlatformGroupSpec } from "../types";

export const CoinbasePlatformDetails: PlatformSpec = {
  icon: "./assets/coinbaseStampIcon.svg",
  platform: "Coinbase",
  name: "Coinbase",
  description: "Connect your existing account to verify with Coinbase.",
  connectMessage: "Connect Account",
};

export const CoinbaseProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Account Name",
    providers: [{ title: "Encrypted", name: "Coinbase" }],
  },
];
