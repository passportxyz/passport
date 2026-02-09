import { PlatformSpec, PlatformGroupSpec, Provider } from "../types.js";
import { BinanceProvider2 } from "./Providers/binance.js";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/binanceStamp.svg",
  platform: "Binance",
  name: "Binance",
  description: "Verify KYC with your Binance Account Bound Token",
  connectMessage: "Connect Account",
  isEVM: true,
  timeToGet: "5-10 minutes",
  price: "~$1",
  cta: {
    label: "Get BABT on Binance",
    href: "https://www.binance.com/en/babt",
  },
  guide: [
    {
      type: "steps",
      items: [
        {
          title: "Step 1",
          description:
            "Obtain your Binance Account Bound Token (BABT) using the same wallet address that you're currently using with this Passport.",
          actions: [
            {
              label: "Get BABT on Binance",
              href: "https://www.binance.com/en/babt",
            },
          ],
        },
        {
          title: "Step 2",
          description: `Click "Check Eligibility" below to check that BABT is owned by this wallet address. This proves you've completed the Government ID verification process (KYC) on Binance.`,
        },
      ],
    },
    {
      type: "list",
      title: "Important considerations",
      items: [
        "You must attach the Binance Account Bound Token (BABT) to the same wallet address that you are using with this Passport",
        "If you attached your BABT to your Binance wallet and aren't using that wallet with Passport, you will not be able to verify this Stamp",
      ],
    },
  ],
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Binance Verification",
    providers: [
      {
        title: "Verify your Binance Account Bound Token (BABT)",
        description:
          "Complete Binance's KYC verification process and mint a BABT to your wallet address to prove account ownership",
        name: "BinanceBABT2",
      },
    ],
  },
];

export const providers: Provider[] = [new BinanceProvider2()];
