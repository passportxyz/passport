import { PlatformSpec, PlatformGroupSpec, Provider } from "../types.js";
import { CoinbaseProvider2 } from "./Providers/coinbase.js";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/coinbaseStampIcon.svg",
  platform: "Coinbase",
  name: "Coinbase",
  description: "Verify your Coinbase account and ID",
  connectMessage: "Connect Account",
  isEVM: true,
  website: "https://www.coinbase.com/onchain-verify",
  timeToGet: "5 minutes",
  price: "Free",
  guide: [
    {
      type: "steps",
      items: [
        {
          title: "Step 1",
          description: "Create your Coinbase onchain verification using your current Passport wallet.",
          actions: [
            {
              label: "Verify on Coinbase",
              href: "https://www.coinbase.com/onchain-verify",
            },
          ],
        },
        {
          title: "Step 2",
          description: "Complete both ID verification and account verification steps on Coinbase.",
        },
        {
          title: "Step 3",
          description: `Click "Check Eligibility" below to link your verified Coinbase account to Passport.`,
        },
      ],
    },
    {
      type: "list",
      title: "Important considerations",
      items: [
        "You must complete both onchain ID verification and account verification",
        "Must use the same wallet address for both Coinbase verification and Passport",
        "Requires an active Coinbase account with verified government ID",
        "Verification creates a free onchain attestation on Base network",
      ],
    },
  ],
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Coinbase Verification",
    providers: [
      {
        title: "Coinbase KYC Verified",
        description:
          "Verified government ID through Coinbase and created onchain attestation proving account ownership",
        name: "CoinbaseDualVerification2",
      },
    ],
  },
];

export const providers: Provider[] = [new CoinbaseProvider2()];
