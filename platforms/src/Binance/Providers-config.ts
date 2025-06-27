import { PlatformSpec, PlatformGroupSpec, Provider } from "../types.js";
import { BinanceProvider2 } from "./Providers/binance.js";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/binanceStamp.svg",
  platform: "Binance",
  name: "Binance",
  description: "Confirm your Binance Account Bound Token to prove your KYC",
  connectMessage: "Connect Account",
  cta: {
    label: "Get BABT Token",
    href: "https://www.binance.com/en/babt",
  },
  steps: [
    {
      number: 1,
      title: "Obtain your Binance Account Bound Token (BABT)",
      description:
        "Visit Binance to get your BABT using the same address that you're currently using with this Passport. This token proves you've completed the Government ID verification process (KYC) on Binance.",
      actions: [
        {
          label: "Get BABT Token",
          href: "https://www.binance.com/en/babt",
        },
      ],
    },
    {
      number: 2,
      title: "Connect your wallet",
      description:
        "Important: You must attach the BABT to the same address that you are using with this Passport. If you attached your BABT to your Binance wallet and aren't using that wallet with Passport, you will not be able to verify this Stamp.",
    },
    {
      number: 3,
      title: "Verify ownership",
      description: "Click 'Verify' below for the Stamp to check that BABT is owned by this wallet address.",
      actions: [
        {
          label: "View detailed guide",
          href: "https://support.passport.xyz/passport-knowledge-base/stamps/how-do-i-add-passport-stamps/guide-to-add-binance-stamp-to-passport",
        },
      ],
    },
  ],
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Confirm your Binance Account Bound Token (BABT)",
    providers: [
      {
        title: "Binance BABT Verification",
        description: "Verify your Binance Account Bound Token (BABT).",
        name: "BinanceBABT2",
      },
    ],
  },
];

export const providers: Provider[] = [new BinanceProvider2()];
