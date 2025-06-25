import { PlatformSpec, PlatformGroupSpec, Provider } from "../types.js";
import { ClanHandsProvider } from "./Providers/index.js";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/humanTechIcon.svg",
  platform: "CleanHands",
  name: "Clean Hands",
  description: "Privately prove you are not sanctioned using Proof of Clean Hands",
  connectMessage: "Verify Account",
  isEVM: true,
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

// Step-by-step guide for the drawer UI
export const steps = [
  {
    number: 1,
    title: "Visit the issuance page",
    description: "Navigate to the Proof of Clean Hands issuance page to begin the verification process.",
    actions: [
      {
        label: "Go to Proof of Clean Hands",
        href: "https://app.holonym.io/clean-hands",
        icon: "external" as const,
      },
    ],
  },
  {
    number: 2,
    title: "Connect your wallet",
    description: "Connect the wallet you want to verify to the issuance page.",
    image: {
      src: "/images/stamps/clean-hands-step-2.png",
      alt: "Wallet connection interface",
    },
  },
  {
    number: 3,
    title: "Complete verification",
    description: "Follow the on-screen instructions to verify your clean hands status.",
    actions: [
      {
        label: "Learn more about verification",
        href: "/help/clean-hands",
      },
    ],
  },
];
