import { PlatformSpec, PlatformGroupSpec, Provider } from "../types.js";
import { CoinbaseProvider2 } from "./Providers/coinbase.js";

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
        title: "Coinbase Onchain Verification",
        description: "Verify your Coinbase ID onchain and successfully login to the Coinbase platform.",
        name: "CoinbaseDualVerification2",
      },
    ],
  },
];

export const providers: Provider[] = [new CoinbaseProvider2()];
