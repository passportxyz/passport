// Mock implementation of @holonym-foundation/human-id-sdk

export interface SBTResult {
  expiry: bigint;
  publicValues: bigint[];
  revoked: boolean;
}

export interface HumanIDInstance {
  getKeygenMessage(): string;
  requestSBT(sbtType: string): Promise<{ recipient?: string; success?: boolean }>;
  privateRequestSBT(
    sbtType: string,
    options: {
      signature: string;
      address: string;
      paymentCallback: (tx: {
        to: string;
        value?: string;
        data?: string;
        chainId: string;
      }) => Promise<{ txHash: string; chainId: number }>;
    }
  ): Promise<{ sbt: { recipient: string; txHash: string; chain: "Optimism" | "NEAR" | "Stellar" } } | null>;
}

// Mock functions
export const initHumanID = jest.fn(
  (): HumanIDInstance => ({
    getKeygenMessage: jest.fn(() => "Sign this message to generate your Human ID key"),
    requestSBT: jest.fn(async (sbtType: string) => ({
      recipient: "0xb4b6f1c68be31841b52f4015a31d1f38b99cdb71",
      success: true,
    })),
    privateRequestSBT: jest.fn(async (sbtType: string, options: any) => ({
      sbt: {
        recipient: options.address,
        txHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab",
        chain: "Optimism" as const,
      },
    })),
  })
);

export const setOptimismRpcUrl = jest.fn((url: string) => {
  if (!url || !url.startsWith("http")) {
    throw new Error("Invalid RPC URL");
  }
});

export const getPhoneSBTByAddress = jest.fn(async (address: string): Promise<SBTResult | null> => {
  if (!address || address === "0x0000000000000000000000000000000000000000") {
    return null;
  }

  if (address.toLowerCase().includes("invalid")) {
    throw new Error("Invalid address format");
  }

  return {
    expiry: BigInt(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    publicValues: [BigInt("0x0"), BigInt("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef")], // [0, nullifier]
    revoked: false,
  };
});

export const getKycSBTByAddress = jest.fn(async (address: string): Promise<SBTResult | null> => {
  if (!address || address === "0x0000000000000000000000000000000000000000") {
    return null;
  }

  if (address.toLowerCase().includes("invalid")) {
    throw new Error("Invalid address format");
  }

  return {
    expiry: BigInt(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    publicValues: [BigInt("0x0"), BigInt("0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba")], // [0, nullifier]
    revoked: false,
  };
});

export const uncheckedGetMinimalPhoneSBTByAddress = jest.fn(async (address: string) => {
  if (!address) {
    return null;
  }

  return {
    address,
    hasPhone: true,
  };
});

export const uncheckedGetMinimalKycSBTByAddress = jest.fn(async (address: string) => {
  if (!address) {
    return null;
  }

  return {
    address,
    hasKyc: true,
  };
});

// Default export (if needed)
export default {
  initHumanID,
  setOptimismRpcUrl,
  getPhoneSBTByAddress,
  getKycSBTByAddress,
  uncheckedGetMinimalPhoneSBTByAddress,
  uncheckedGetMinimalKycSBTByAddress,
};
