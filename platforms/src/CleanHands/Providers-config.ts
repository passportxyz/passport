import { PlatformSpec, PlatformGroupSpec, Provider } from "../types.js";
import { ClanHandsProvider } from "./Providers/index.js";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/humanTechIcon.svg",
  platform: "CleanHands",
  name: "Proof of Clean Hands",
  description: "Prove you're not on sanctions lists, powered by human.tech",
  connectMessage: "Verify Account",
  isEVM: true,
  timeToGet: "10 minutes",
  price: "$5 + gas fees",
  guide: [
    {
      type: "steps",
      items: [
        {
          title: "Step 1",
          description: "Navigate to Proof of Clean Hands verification module.",
          actions: [
            {
              label: "Verify Clean Hands",
              href: "https://silksecure.net/holonym/diff-wallet/clean-hands",
            },
          ],
        },
        {
          title: "Step 2",
          description: "Follow prompts to verify your government ID and complete liveness check to prove identity.",
        },
        {
          title: "Step 3",
          description: "Generate proof that you are not on sanctions lists or politically exposed person lists.",
        },
        {
          title: "Step 4",
          description: "Mint the verification token to your wallet (requires $5 for payment and gas fees).",
        },
        {
          title: "Step 5",
          description: 'Return to Passport and click "Check Eligibility" below to add your Proof of Clean Hands Stamp.',
        },
      ],
    },
    {
      type: "list",
      title: "Important considerations",
      items: [
        "Requires government ID verification",
        "Available on Ethereum, Optimism, Avalanche, and Base networks",
        "Stamp auto-renews after 90 days; full reverification required after 1 year",
        "Some countries excluded from verification process",
      ],
    },
  ],
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Proof of Clean Hands",
    providers: [
      {
        title: "Sanctions-Free Identity Verified",
        description:
          "Awarded after completing identity verification and sanctions validation, strengthening your humanity proof",
        name: "CleanHands",
      },
    ],
  },
];

export const providers: Provider[] = [new ClanHandsProvider()];
