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
        title: "Coinbase – (Retired)",
        description:
          "You earned this credential before the December 2024 stamp weight updates. This will be removed when this credential expires.",
        name: "CoinbaseDualVerification",
        isDeprecated: true,
      },
      {
        title: "Coinbase Onchain Verification",
        description: "Verify your Coinbase ID onchain and successfully login to the Coinbase platform.",
        name: "CoinbaseDualVerification2",
      },
    ],
  },
];

export const providers: Provider[] = [new CoinbaseProvider(), new CoinbaseProvider2()];
