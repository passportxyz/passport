// Mock data for Variant 1 - Multiple Credentials (Ethereum example)

export interface TestCredential {
  id: string;
  name: string;
  description: string;
  verified: boolean;
  points: number;
  pointsDisplay: string;
  flags?: ("expired" | "deduplicated")[];
}

export interface CredentialGroup {
  title: string;
  credentials: TestCredential[];
}

export interface TestStampDataVariant1 {
  variant: 1;
  platformInfo: {
    name: string;
    icon: string;
    description: string;
  };
  verificationState: {
    isVerified: boolean;
    pointsGained: number;
    totalPossiblePoints: number;
    validityDays?: number;
  };
  credentialGroups: CredentialGroup[];
}

export const ethereumMockData: TestStampDataVariant1 = {
  variant: 1,
  platformInfo: {
    name: "Ethereum",
    icon: "⟠",
    description:
      "Passport analyzes your transaction history to detect Sybil behavior, awarding points based on your address's overall activity.",
  },
  verificationState: {
    isVerified: true,
    pointsGained: 2.8,
    totalPossiblePoints: 23,
    validityDays: 89,
  },
  credentialGroups: [
    {
      title: "Engagement Milestones",
      credentials: [
        {
          id: "eth-enthusiast",
          name: "ETH Enthusiast",
          description: "Marks the initiation of engagement within the Ethereum ecosystem.",
          verified: false,
          points: 16,
          pointsDisplay: "16",
        },
        {
          id: "eth-advocate",
          name: "ETH Advocate",
          description: "Represents a higher level of commitment and activity.",
          verified: true,
          points: 2.4,
          pointsDisplay: "2.4",
          flags: [],
        },
        {
          id: "eth-maxi",
          name: "ETH MAXI",
          description: "Denotes exceptional involvement and dedication.",
          verified: true,
          points: 2.9,
          pointsDisplay: "2.9",
          flags: ["expired"],
        },
      ],
    },
    {
      title: "Your Ethereum Activity Metrics",
      credentials: [
        {
          id: "spend-gas",
          name: "Spend more than 0.25 ETH on gas",
          description: "Highlights significant financial engagement with the network.",
          verified: true,
          points: 0.8,
          pointsDisplay: "0.8",
          flags: ["deduplicated"],
        },
        {
          id: "execute-transactions",
          name: "Execute over 100 transactions",
          description: "Indicates a robust level of transactional activity.",
          verified: true,
          points: 0.2,
          pointsDisplay: "0.2",
          flags: [],
        },
        {
          id: "active-days",
          name: "Active on over 50 distinct days",
          description: "Showcases sustained interaction with Ethereum.",
          verified: true,
          points: 0.2,
          pointsDisplay: "0.2",
          flags: [],
        },
      ],
    },
  ],
};

// Additional test cases for different states
export const allStatesTestData: TestStampDataVariant1 = {
  variant: 1,
  platformInfo: {
    name: "Test Platform",
    icon: "🧪",
    description: "A test platform showcasing all possible credential states.",
  },
  verificationState: {
    isVerified: false,
    pointsGained: 0,
    totalPossiblePoints: 10,
  },
  credentialGroups: [
    {
      title: "All Credential States",
      credentials: [
        {
          id: "not-verified",
          name: "Not Verified Credential",
          description: "This credential has not been verified yet.",
          verified: false,
          points: 2.5,
          pointsDisplay: "2.5",
        },
        {
          id: "verified-clean",
          name: "Verified Credential",
          description: "Successfully verified with no flags.",
          verified: true,
          points: 2.5,
          pointsDisplay: "2.5",
          flags: [],
        },
        {
          id: "verified-expired",
          name: "Expired Credential",
          description: "Previously verified but now expired.",
          verified: true,
          points: 2.5,
          pointsDisplay: "2.5",
          flags: ["expired"],
        },
        {
          id: "verified-deduplicated",
          name: "Deduplicated Credential",
          description: "Verified but not counted due to deduplication.",
          verified: true,
          points: 0,
          pointsDisplay: "0",
          flags: ["deduplicated"],
        },
        {
          id: "verified-both-flags",
          name: "Multiple Flags Credential",
          description: "Has both expired and deduplicated flags.",
          verified: true,
          points: 0,
          pointsDisplay: "0",
          flags: ["expired", "deduplicated"],
        },
      ],
    },
  ],
};
