import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { CoinbaseProvider } from "./Providers/coinbase";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/coinbaseStampIcon.svg",
  platform: "Coinbase",
  name: "Coinbase",
  description: "Confirm Your Coinbase Account & Onchain Identity",
  connectMessage: "Connect Account",
  website: "https://www.coinbase.com/onchain-verify",
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Account & Identity Verification",
    providers: [
      {
        title: "Your privacy is paramount. We only retain a unique hash to acknowledge your account's verification.",
        name: "CoinbaseDualVerification",
      },
    ],
  },
];

export const providers: Provider[] = [new CoinbaseProvider()];
