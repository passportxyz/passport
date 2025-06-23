// Mock data for Variant 2 - Guided Experience (Clean Hands example)

export interface TestStep {
  number: number;
  title: string;
  description: string;
  actions?: {
    label: string;
    href?: string;
    onClick?: () => void;
    icon?: "external" | "arrow";
  }[];
  image?: {
    src: string;
    alt: string;
  };
}

export interface TestStampDataVariant2 {
  variant: 2;
  platformInfo: {
    name: string;
    icon: string;
    description: string;
  };
  verificationState: {
    isVerified: boolean;
    timeToGet?: string;
    price?: string;
    pointsGained?: number;
    totalPossiblePoints: number;
  };
  steps: TestStep[];
  credentials: {
    id: string;
    name: string;
    description: string;
    verified: boolean;
    points: number;
    pointsDisplay: string;
  }[];
}

export const cleanHandsMockData: TestStampDataVariant2 = {
  variant: 2,
  platformInfo: {
    name: "Clean hands",
    icon: "🖐",
    description: "Privately prove you are not sanctioned using Proof of Clean Hands",
  },
  verificationState: {
    isVerified: false,
    timeToGet: "~5 min",
    price: "~$5.00",
    pointsGained: 0,
    totalPossiblePoints: 1,
  },
  steps: [
    {
      number: 1,
      title: "Visit the issuance page",
      description:
        "Go to the credential issuance page.\nNote: This attestation requires you to prove your identity first. If you've verified your identity with Holonym before, you will be redirected straight to step 5.",
      actions: [
        {
          label: "Go to Proof of Clean Hands",
          href: "https://app.holonym.io/prove/uniqueness",
          icon: "external",
        },
      ],
    },
    {
      number: 2,
      title: "Connect your wallet",
      description:
        "Connect your wallet to a supported network (Ethereum, Optimism, Avalanche, Fantom, or Base). Make sure your balance is greater than $1 to cover both the payment and gas fees, which vary by network.",
      image: {
        src: "/test-images/wallet-connect.png",
        alt: "Wallet connection interface",
      },
    },
    {
      number: 3,
      title: "Verify your clean hands status",
      description:
        "Human ID will verify that you are not on any sanctions lists and are not a politically exposed person.",
      image: {
        src: "/test-images/verification-screen.png",
        alt: "Clean hands verification screen",
      },
    },
    {
      number: 4,
      title: "Pay for the verification",
      description:
        "The attestation costs approximately $5. This fee helps maintain the privacy-preserving infrastructure.",
      actions: [
        {
          label: "Learn about pricing",
          href: "/help/clean-hands-pricing",
          icon: "arrow",
        },
      ],
    },
    {
      number: 5,
      title: "Receive your attestation",
      description:
        "Once verified, you'll receive your clean hands attestation. Return to Gitcoin Passport to complete the stamp verification.",
    },
  ],
  credentials: [
    {
      id: "sanctions-free-1",
      name: "Sanctions-Free Identity Verified",
      description: "Awarded after completing Holonym KYC and sanctions validation, strengthening your humanity proof",
      verified: false,
      points: 1,
      pointsDisplay: "1",
    },
    {
      id: "sanctions-free-2",
      name: "Sanctions-Free Identity Verified",
      description: "Awarded after completing Holonym KYC and sanctions validation, strengthening your humanity proof",
      verified: false,
      points: 1,
      pointsDisplay: "1",
    },
  ],
};

// Verified state example
export const cleanHandsVerifiedMockData: TestStampDataVariant2 = {
  ...cleanHandsMockData,
  verificationState: {
    isVerified: true,
    pointsGained: 1,
    totalPossiblePoints: 1,
  },
  credentials: [
    {
      id: "sanctions-free-1",
      name: "Sanctions-Free Identity Verified",
      description: "Awarded after completing Holonym KYC and sanctions validation, strengthening your humanity proof",
      verified: true,
      points: 1,
      pointsDisplay: "1",
    },
    {
      id: "sanctions-free-2",
      name: "Sanctions-Free Identity Verified",
      description: "Awarded after completing Holonym KYC and sanctions validation, strengthening your humanity proof",
      verified: true,
      points: 1,
      pointsDisplay: "1",
    },
  ],
};
