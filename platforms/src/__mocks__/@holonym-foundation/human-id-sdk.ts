// Mock implementation of @holonym-foundation/human-id-sdk

export interface SBTResult {
  address: string;
  timestamp: number;
  tokenId: string;
  chainId: number;
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
  ): Promise<{ recipient?: string; success?: boolean; txHash?: string }>;
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
      recipient: options.address,
      success: true,
      txHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab",
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
    address,
    timestamp: Date.now(),
    tokenId: "123",
    chainId: 10,
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
    address,
    timestamp: Date.now(),
    tokenId: "456",
    chainId: 10,
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
