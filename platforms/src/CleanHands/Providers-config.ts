import { PlatformSpec, PlatformGroupSpec, Provider } from "../types.js";
import { ClanHandsProvider } from "./Providers/index.js";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/humanTechIcon.svg",
  platform: "CleanHands",
  name: "Clean Hands",
  description: "Privately prove you are not sanctioned using Proof of Clean Hands",
  connectMessage: "Verify Account",
  isEVM: true,
  timeToGet: "10-15 min",
  price: "$15",
  guide: [
    {
      type: "steps",
      items: [
        {
          title: "Navigate to Proof of Clean Hands verification module",
          description: "Visit the verification page to begin the sanctions check process.",
          actions: [
            {
              label: "Verify Clean Hands",
              href: "https://silksecure.net/holonym/diff-wallet/clean-hands",
            },
          ],
        },
        {
          title: "Verify your government ID",
          description: "Follow prompts to verify your government ID and complete liveness check to prove identity.",
        },
        {
          title: "Generate sanctions-free proof",
          description: "Generate proof that you are not on sanctions lists or politically exposed person lists.",
        },
        {
          title: "Mint verification token",
          description: "Mint the verification token to your wallet (requires $5 for payment and gas fees).",
        },
        {
          title: "Return to Passport",
          description: "Return to Passport and click 'Check Eligibility' below to add your Proof of Clean Hands Stamp.",
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
        description: "Awarded after completing Holonym KYC and sanctions validation, strengthening your humanity proof",
        name: "CleanHands",
      },
    ],
  },
];

export const providers: Provider[] = [new ClanHandsProvider()];
