import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { CoinbaseProvider, CoinbaseProvider2 } from "./Providers/coinbase";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/coinbaseStampIcon.svg",
  platform: "Coinbase",
  name: "Coinbase",
  description: "Confirm Your Coinbase Verified ID",
  connectMessage: "Connect Account",
  website: "https://www.coinbase.com/onchain-verify",
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Account & Onchain Identity",
    providers: [
      {
        title: "Privacy-First Verification (deprecated)",
        description: "(Deprecated)",
        name: "CoinbaseDualVerification",
        isDeprecated: true,
      },
      {
        title: "Privacy-First Verification",
        description:
          "Your privacy is paramount. We only retain a unique hash to acknowledge your account's verification.",
        name: "CoinbaseDualVerification2",
      },
    ],
  },
];

export const providers: Provider[] = [new CoinbaseProvider(), new CoinbaseProvider2()];
