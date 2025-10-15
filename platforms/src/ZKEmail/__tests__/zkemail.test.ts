import { RequestPayload, ProviderContext } from "@gitcoin/passport-types";
import {
  AmazonCasualPurchaserProvider,
  AmazonRegularCustomerProvider,
  AmazonHeavyUserProvider,
  UberOccasionalRiderProvider,
  UberRegularRiderProvider,
  UberPowerUserProvider,
} from "../Providers/zkemail.js";
import * as zkEmailSdk from "@zk-email/sdk";
import type { RawEmailResponse, Proof } from "@zk-email/sdk";
import {
  shouldContinueFetchingEmails,
  normalizeWalletAddress,
  countVerifiedProofs,
  getRequestedMaxThreshold,
} from "../utils.js";
import {
  AMAZON_STOP_FETCH_LIMIT,
  UBER_STOP_FETCH_LIMIT,
  AMAZON_CASUAL_PURCHASER_THRESHOLD,
  AMAZON_REGULAR_CUSTOMER_THRESHOLD,
  AMAZON_HEAVY_USER_THRESHOLD,
  UBER_OCCASIONAL_RIDER_THRESHOLD,
  UBER_REGULAR_RIDER_THRESHOLD,
  UBER_POWER_USER_THRESHOLD,
  ZkEmailCacheEntry,
} from "../types.js";

// Type for mock context with ZKEmail cache
type ZkEmailContext = ProviderContext & {
  zkemail?: {
    amazon?: ZkEmailCacheEntry;
    uber?: ZkEmailCacheEntry;
  };
};

// Type for mock proof objects in tests
interface MockProof {
  verify: jest.Mock<Promise<boolean>>;
  getProofData: jest.Mock<{
    publicData: { subject: string[]; email_recipient: string };
    externalInputs: { wallet_address: string };
  }>;
}

jest.mock("@zk-email/sdk", () => {
  const Gmail = jest.fn();
  const LoginWithGoogle = jest.fn();
  return {
    initZkEmailSdk: jest.fn(),
    Gmail,
    LoginWithGoogle,
  };
});

const MOCK_ADDRESS = "0xcF314CE817E25b4F784bC1f24c9A79A525fEC50f";
const MOCK_ADDRESS_NORMALIZED = "0xcf314ce817e25b4f784bc1f24c9a79a525fec50f";
const MOCK_ADDRESS_DIFFERENT = "0x1234567890123456789012345678901234567890";

const getMockPayload = (
  proofs: unknown,
  proofType: "amazon" | "uber",
  address: string = MOCK_ADDRESS
): RequestPayload =>
  ({
    address,
    proofs: {
      [`${proofType}Proofs`]: proofs,
    },
  }) as unknown as RequestPayload;

const mockUnpackProof = jest.fn();
const mockProofVerify = jest.fn();
const mockGetProofData = jest.fn();

const mockSdk = {
  unPackProof: mockUnpackProof,
};

(zkEmailSdk.initZkEmailSdk as jest.Mock).mockReturnValue(mockSdk);

const MOCK_EMAIL_HASH = "hashed_email_abc123";
const MOCK_EMAIL_HASH_DIFFERENT = "hashed_email_xyz789";

// Helper function to create mock proof with subject, wallet, and email
const createMockProofWithSubject = (
  subject: string,
  walletAddress: string = MOCK_ADDRESS_NORMALIZED,
  verifyResult: boolean = true,
  emailHash: string = MOCK_EMAIL_HASH
): MockProof => ({
  verify: jest.fn<Promise<boolean>, []>().mockResolvedValue(verifyResult),
  getProofData: jest
    .fn<
      {
        publicData: { subject: string[]; email_recipient: string };
        externalInputs: { wallet_address: string };
      },
      []
    >()
    .mockReturnValue({
      publicData: {
        subject: [subject],
        email_recipient: emailHash,
      },
      externalInputs: {
        wallet_address: walletAddress,
      },
    }),
});

describe("ZKEmail Providers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the mock implementations to a default state before each test
    mockUnpackProof.mockImplementation(async (_proof) =>
      createMockProofWithSubject("Your order confirmation", MOCK_ADDRESS_NORMALIZED, true, MOCK_EMAIL_HASH)
    );
    mockProofVerify.mockResolvedValue(true);
    mockGetProofData.mockReturnValue({
      publicData: {
        subject: ["Your order confirmation"],
        email_recipient: MOCK_EMAIL_HASH,
      },
      externalInputs: {
        wallet_address: MOCK_ADDRESS_NORMALIZED,
      },
    });
  });

  describe("AmazonCasualPurchaserProvider", () => {
    it("should verify successfully with enough valid proofs and correct wallet binding", async () => {
      const provider = new AmazonCasualPurchaserProvider();

      // Mock proofs with Amazon-specific subjects (with keyword "shipped") and correct wallet
      mockUnpackProof.mockImplementation(async (_proof) =>
        createMockProofWithSubject("Your Amazon order has shipped", MOCK_ADDRESS_NORMALIZED, true)
      );

      const proofs: string[] = [];
      for (let i = 0; i < provider.getThreshold(); i++) {
        proofs.push(`proof${i}`);
      }

      const payload = getMockPayload(proofs, "amazon");
      const result = await provider.verify(payload);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.record).toEqual({
        hashedEmail: MOCK_EMAIL_HASH,
        totalProofs: proofs.length.toString(),
        proofType: "amazon",
      });
    });

    it("should fail verification if proof count is below threshold", async () => {
      // Mock proofs that fail verification but have valid Amazon subjects
      mockUnpackProof.mockImplementation(async (_proof) =>
        createMockProofWithSubject("Your Amazon order has shipped", MOCK_ADDRESS_NORMALIZED, false)
      );
      const provider = new AmazonCasualPurchaserProvider();
      const payload = getMockPayload(["proof1"], "amazon");
      const result = await provider.verify(payload);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("No valid amazon proofs found");
    });

    it("should fail if no proofs are provided", async () => {
      const provider = new AmazonCasualPurchaserProvider();
      const payload = { address: MOCK_ADDRESS, proofs: {} } as RequestPayload;
      const result = await provider.verify(payload);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("No amazon proofs provided in payload");
    });

    it("should fail for empty proofs array", async () => {
      const provider = new AmazonCasualPurchaserProvider();
      const payload = getMockPayload([], "amazon");
      const result = await provider.verify(payload);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Invalid or empty amazon proofs array");
    });

    it("should handle errors during proof verification", async () => {
      // Mock proofs with valid Amazon subjects, wallet, and email but failing verification
      const mockVerifyFn = jest.fn().mockRejectedValue(new Error("Verification failed"));
      mockUnpackProof.mockImplementation(async (_proof) => ({
        verify: mockVerifyFn,
        getProofData: jest.fn().mockReturnValue({
          publicData: {
            subject: ["Your Amazon order has shipped"],
            email_recipient: MOCK_EMAIL_HASH,
          },
          externalInputs: {
            wallet_address: MOCK_ADDRESS_NORMALIZED,
          },
        }),
      }));

      const provider = new AmazonCasualPurchaserProvider();
      const payload = getMockPayload(["proof1"], "amazon");
      const result = await provider.verify(payload);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("No valid amazon proofs found");
    });

    it("should handle errors during proof unpacking", async () => {
      mockUnpackProof.mockRejectedValue(new Error("Unpack failed"));
      const provider = new AmazonCasualPurchaserProvider();
      const payload = getMockPayload(["proof1"], "amazon");
      const result = await provider.verify(payload);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Failed to verify email: Unpack failed");
    });

    it("should fail verification when proofs don't contain valid Amazon subjects", async () => {
      // Mock proofs with non-Amazon subjects (should be filtered out)
      mockUnpackProof.mockImplementation(async (_proof) =>
        createMockProofWithSubject("Random newsletter subject", MOCK_ADDRESS_NORMALIZED, true)
      );

      const provider = new AmazonCasualPurchaserProvider();
      const payload = getMockPayload(["proof1", "proof2", "proof3"], "amazon");
      const result = await provider.verify(payload);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("No valid amazon proofs found");
    });

    it("should reject proof bound to different wallet", async () => {
      const provider = new AmazonCasualPurchaserProvider();

      // Mock proof with different wallet in public data
      mockUnpackProof.mockImplementation(async (_proof) =>
        createMockProofWithSubject("Your Amazon order shipped", MOCK_ADDRESS_DIFFERENT, true)
      );

      const payload = getMockPayload(["proof1"], "amazon", MOCK_ADDRESS);
      const result = await provider.verify(payload);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("Proof not bound to requesting wallet");
      expect(result.errors[0]).toContain(MOCK_ADDRESS_NORMALIZED);
      expect(result.errors[0]).toContain(MOCK_ADDRESS_DIFFERENT);
    });

    it("should reject proof missing wallet_address in external inputs", async () => {
      const provider = new AmazonCasualPurchaserProvider();

      mockUnpackProof.mockImplementation(async (_proof) => ({
        verify: jest.fn().mockResolvedValue(true),
        getProofData: jest.fn().mockReturnValue({
          publicData: {
            subject: ["Your Amazon order shipped"],
          },
          externalInputs: {
            // Missing wallet_address
          },
        }),
      }));

      const payload = getMockPayload(["proof1"], "amazon");
      const result = await provider.verify(payload);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("Wallet address is required");
    });

    it("should normalize wallet addresses (case insensitive)", async () => {
      const provider = new AmazonCasualPurchaserProvider();

      // Mock proof with uppercase wallet
      mockUnpackProof.mockImplementation(async (_proof) =>
        createMockProofWithSubject("Your Amazon order shipped", MOCK_ADDRESS.toUpperCase(), true)
      );

      const payload = getMockPayload(["proof1"], "amazon", MOCK_ADDRESS.toLowerCase());
      const result = await provider.verify(payload);

      expect(result.valid).toBe(true); // Should normalize and match
    });

    it("should reject if wallet address is missing from payload", async () => {
      const provider = new AmazonCasualPurchaserProvider();
      const payload = {
        proofs: {
          amazonProofs: ["proof1"],
        },
      } as unknown as RequestPayload;

      const result = await provider.verify(payload);

      expect(result.valid).toBe(false);
      // Updated to match new validation that catches missing fields earlier
      expect(result.errors).toContain("Invalid payload structure: missing required fields (address or proofs)");
    });
  });

  describe("UberOccasionalRiderProvider", () => {
    it("should verify successfully with enough valid proofs and correct wallet binding", async () => {
      const provider = new UberOccasionalRiderProvider();

      // Mock proofs with Uber-specific subjects and correct wallet
      mockUnpackProof.mockImplementation(async (_proof) =>
        createMockProofWithSubject("Your trip receipt from Uber", MOCK_ADDRESS_NORMALIZED, true)
      );

      const payload = getMockPayload(["proof1", "proof2", "proof3"], "uber");
      const result = await provider.verify(payload);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.record).toEqual({
        hashedEmail: MOCK_EMAIL_HASH,
        totalProofs: "3",
        proofType: "uber",
      });
    });

    it("should fail if no proofs are provided", async () => {
      const provider = new UberOccasionalRiderProvider();
      const payload = { address: MOCK_ADDRESS, proofs: {} } as RequestPayload;
      const result = await provider.verify(payload);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("No uber proofs provided in payload");
    });

    it("should fail verification when proofs don't contain valid Uber subjects", async () => {
      // Mock proofs with non-Uber subjects (should be filtered out)
      mockUnpackProof.mockImplementation(async (_proof) =>
        createMockProofWithSubject("Random promotional email", MOCK_ADDRESS_NORMALIZED, true)
      );

      const provider = new UberOccasionalRiderProvider();
      const payload = getMockPayload(["proof1", "proof2", "proof3"], "uber");
      const result = await provider.verify(payload);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("No valid uber proofs found");
    });

    it("should reject proof bound to different wallet", async () => {
      const provider = new UberOccasionalRiderProvider();

      mockUnpackProof.mockImplementation(async (_proof) =>
        createMockProofWithSubject("Your trip receipt", MOCK_ADDRESS_DIFFERENT, true)
      );

      const payload = getMockPayload(["proof1", "proof2", "proof3"], "uber", MOCK_ADDRESS);
      const result = await provider.verify(payload);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("Proof not bound to requesting wallet");
    });
  });

  // Simple test for other providers to ensure they are set up correctly
  describe("Other Amazon Providers", () => {
    it("AmazonRegularCustomerProvider should have correct type", () => {
      const provider = new AmazonRegularCustomerProvider();
      expect(provider.type).toBe("ZKEmail#AmazonRegularCustomer");
    });

    it("AmazonHeavyUserProvider should have correct type", () => {
      const provider = new AmazonHeavyUserProvider();
      expect(provider.type).toBe("ZKEmail#AmazonHeavyUser");
    });
  });

  describe("Other Uber Providers", () => {
    it("UberRegularRiderProvider should have correct type", () => {
      const provider = new UberRegularRiderProvider();
      expect(provider.type).toBe("ZKEmail#UberRegularRider");
    });

    it("UberPowerUserProvider should have correct type", () => {
      const provider = new UberPowerUserProvider();
      expect(provider.type).toBe("ZKEmail#UberPowerUser");
    });
  });

  describe("shouldContinueFetchingEmails helper", () => {
    it("returns false when emails page is empty", () => {
      expect(shouldContinueFetchingEmails([], 0, "uber")).toBe(false);
    });

    it("returns true when under limit and page has emails", () => {
      expect(shouldContinueFetchingEmails([{ decodedContents: "x" } as unknown as RawEmailResponse], 1, "uber")).toBe(
        true
      );
    });

    it("returns false once Uber stop limit is reached", () => {
      expect(
        shouldContinueFetchingEmails(
          [{ decodedContents: "x" } as unknown as RawEmailResponse],
          UBER_STOP_FETCH_LIMIT,
          "uber"
        )
      ).toBe(false);
    });

    it("returns false once Amazon stop limit is reached", () => {
      expect(
        shouldContinueFetchingEmails(
          [{ decodedContents: "x" } as unknown as RawEmailResponse],
          AMAZON_STOP_FETCH_LIMIT,
          "amazon"
        )
      ).toBe(false);
    });
  });

  describe("Email Validation and Deduplication", () => {
    it("should reject proofs from different email accounts", async () => {
      const provider = new AmazonCasualPurchaserProvider();

      // Mock proofs with different email hashes
      let callCount = 0;
      mockUnpackProof.mockImplementation(async (_proof) => {
        callCount++;
        const emailHash = callCount === 1 ? MOCK_EMAIL_HASH : MOCK_EMAIL_HASH_DIFFERENT;
        return createMockProofWithSubject("Your Amazon order shipped", MOCK_ADDRESS_NORMALIZED, true, emailHash);
      });

      const payload = getMockPayload(["proof1", "proof2"], "amazon");
      const result = await provider.verify(payload);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("All proofs must be from the same email account");
    });

    it("should reject proof missing email_recipient field", async () => {
      const provider = new AmazonCasualPurchaserProvider();

      // Mock proof without email_recipient
      mockUnpackProof.mockImplementation(async (_proof) => ({
        verify: jest.fn().mockResolvedValue(true),
        getProofData: jest.fn().mockReturnValue({
          publicData: {
            subject: ["Your Amazon order shipped"],
            // Missing email_recipient
          },
          externalInputs: {
            wallet_address: MOCK_ADDRESS_NORMALIZED,
          },
        }),
      }));

      const payload = getMockPayload(["proof1"], "amazon");
      const result = await provider.verify(payload);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("Proof missing email_recipient in public data");
    });

    it("should accept proofs from the same email account", async () => {
      const provider = new AmazonCasualPurchaserProvider();

      // Mock multiple proofs all with same email hash
      mockUnpackProof.mockImplementation(async (_proof) =>
        createMockProofWithSubject("Your Amazon order shipped", MOCK_ADDRESS_NORMALIZED, true, MOCK_EMAIL_HASH)
      );

      const payload = getMockPayload(["proof1", "proof2", "proof3"], "amazon");
      const result = await provider.verify(payload);

      expect(result.valid).toBe(true);
      expect(result.record?.hashedEmail).toBe(MOCK_EMAIL_HASH);
    });

    it("should include hashedEmail in record for deduplication", async () => {
      const provider = new UberOccasionalRiderProvider();

      mockUnpackProof.mockImplementation(async (_proof) =>
        createMockProofWithSubject("Your trip receipt from Uber", MOCK_ADDRESS_NORMALIZED, true, MOCK_EMAIL_HASH)
      );

      const payload = getMockPayload(["proof1", "proof2", "proof3"], "uber");
      const result = await provider.verify(payload);

      expect(result.valid).toBe(true);
      expect(result.record?.hashedEmail).toBe(MOCK_EMAIL_HASH);
      expect(typeof result.record?.hashedEmail).toBe("string");
    });

    it("should cache hashedEmail and reuse across variants", async () => {
      const mockContext: ZkEmailContext = {};
      // Need at least 10 proofs for Regular Customer Provider
      const proofArray = Array(10)
        .fill(0)
        .map((_, i) => `proof${i}`);
      const payload = getMockPayload(proofArray, "amazon");
      payload.types = ["ZKEmail#AmazonCasualPurchaser", "ZKEmail#AmazonRegularCustomer"];

      mockUnpackProof.mockImplementation(async (_proof) =>
        createMockProofWithSubject("Your Amazon order shipped", MOCK_ADDRESS_NORMALIZED, true, MOCK_EMAIL_HASH)
      );

      const provider1 = new AmazonCasualPurchaserProvider();
      const provider2 = new AmazonRegularCustomerProvider();

      const result1 = await provider1.verify(payload, mockContext);
      const result2 = await provider2.verify(payload, mockContext);

      // Both should return the same hashed email
      expect(result1.valid).toBe(true);
      expect(result2.valid).toBe(true);
      expect(result1.record?.hashedEmail).toBe(MOCK_EMAIL_HASH);
      expect(result2.record?.hashedEmail).toBe(MOCK_EMAIL_HASH);

      // Verify cache is properly structured (email extracted on-demand from proofs)
      expect(mockContext.zkemail?.amazon?.unpackedProofs).toBeDefined();
      expect(mockContext.zkemail?.amazon?.unpackedProofs.length).toBeGreaterThan(0);
    });

    it("should handle email_recipient as array format", async () => {
      const provider = new AmazonCasualPurchaserProvider();

      // Mock proof with email_recipient as array
      mockUnpackProof.mockImplementation(async (_proof) => ({
        verify: jest.fn().mockResolvedValue(true),
        getProofData: jest.fn().mockReturnValue({
          publicData: {
            subject: ["Your Amazon order shipped"],
            email_recipient: [MOCK_EMAIL_HASH], // Array format
          },
          externalInputs: {
            wallet_address: MOCK_ADDRESS_NORMALIZED,
          },
        }),
      }));

      const payload = getMockPayload(["proof1"], "amazon");
      const result = await provider.verify(payload);

      expect(result.valid).toBe(true);
      expect(result.record?.hashedEmail).toBe(MOCK_EMAIL_HASH);
    });

    it("should reject empty email_recipient", async () => {
      const provider = new AmazonCasualPurchaserProvider();

      // Mock proof with empty email_recipient
      mockUnpackProof.mockImplementation(async (_proof) => ({
        verify: jest.fn().mockResolvedValue(true),
        getProofData: jest.fn().mockReturnValue({
          publicData: {
            subject: ["Your Amazon order shipped"],
            email_recipient: "", // Empty string
          },
          externalInputs: {
            wallet_address: MOCK_ADDRESS_NORMALIZED,
          },
        }),
      }));

      const payload = getMockPayload(["proof1"], "amazon");
      const result = await provider.verify(payload);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("Proof missing email_recipient in public data");
    });

    it("should handle whitespace-only email_recipient", async () => {
      const provider = new AmazonCasualPurchaserProvider();

      // Mock proof with whitespace-only email_recipient
      mockUnpackProof.mockImplementation(async (_proof) => ({
        verify: jest.fn().mockResolvedValue(true),
        getProofData: jest.fn().mockReturnValue({
          publicData: {
            subject: ["Your Amazon order shipped"],
            email_recipient: "   ", // Whitespace only
          },
          externalInputs: {
            wallet_address: MOCK_ADDRESS_NORMALIZED,
          },
        }),
      }));

      const payload = getMockPayload(["proof1"], "amazon");
      const result = await provider.verify(payload);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("Proof missing email_recipient in public data");
    });
  });

  describe("Wallet Utilities", () => {
    describe("normalizeWalletAddress", () => {
      it("should normalize to lowercase with 0x", () => {
        expect(normalizeWalletAddress("0xABCDEF1234567890123456789012345678901234")).toBe(
          "0xabcdef1234567890123456789012345678901234"
        );
        expect(normalizeWalletAddress("ABCDEF1234567890123456789012345678901234")).toBe(
          "0xabcdef1234567890123456789012345678901234"
        );
        expect(normalizeWalletAddress("0xabcdef1234567890123456789012345678901234")).toBe(
          "0xabcdef1234567890123456789012345678901234"
        );
      });

      it("should throw for invalid addresses", () => {
        expect(() => normalizeWalletAddress("")).toThrow("Wallet address is required");
        expect(() => normalizeWalletAddress("0x123")).toThrow("Invalid wallet address format");
        expect(() => normalizeWalletAddress("not_a_wallet")).toThrow("Invalid wallet address format");
        expect(() => normalizeWalletAddress("0xGGGGGG1234567890123456789012345678901234")).toThrow(
          "Invalid wallet address format"
        );
      });

      it("should handle wallet with or without 0x prefix", () => {
        const address = "cF314CE817E25b4F784bC1f24c9A79A525fEC50f";
        expect(normalizeWalletAddress(address)).toBe(`0x${address.toLowerCase()}`);
        expect(normalizeWalletAddress(`0x${address}`)).toBe(`0x${address.toLowerCase()}`);
      });
    });
  });
});

// ============================================================================
// Caching Optimization Tests
// ============================================================================

describe("ZKEmail Caching Optimization", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================================================
  // 1. Context Caching (Cache Hit Scenarios)
  // ==========================================================================

  describe("Context Caching (Cache Hit Scenarios)", () => {
    it("should cache unpacked proofs and reuse across provider variants", async () => {
      // Setup: 3 provider variants, 50 valid proofs
      const providers = [
        new AmazonCasualPurchaserProvider(), // threshold: 1
        new AmazonRegularCustomerProvider(), // threshold: 10
        new AmazonHeavyUserProvider(), // threshold: 50
      ];

      const mockContext: ZkEmailContext = {};
      const proofArray = Array(50)
        .fill(0)
        .map((_, i) => `proof${i}`);
      const payload = getMockPayload(proofArray, "amazon");
      payload.types = ["ZKEmail#AmazonCasualPurchaser", "ZKEmail#AmazonRegularCustomer", "ZKEmail#AmazonHeavyUser"];

      // Mock SDK - track calls
      let unpackCalls = 0;
      mockUnpackProof.mockImplementation(async () => {
        unpackCalls++;
        return createMockProofWithSubject("Your Amazon order shipped", MOCK_ADDRESS_NORMALIZED, true);
      });

      // Execute all 3 providers with same context
      const result1 = await providers[0].verify(payload, mockContext);
      const result2 = await providers[1].verify(payload, mockContext);
      const result3 = await providers[2].verify(payload, mockContext);

      // Assertions
      expect(unpackCalls).toBe(50); // Unpacked only once!
      expect(result1.valid).toBe(true);
      expect(result2.valid).toBe(true);
      expect(result3.valid).toBe(true);

      // Verify cache structure
      expect(mockContext.zkemail?.amazon).toBeDefined();
      expect(mockContext.zkemail?.amazon?.unpackedProofs).toHaveLength(50);
      expect(mockContext.zkemail?.amazon?.validCountMaxUpTo).toBe(50);
    });

    it("should maintain separate caches for Amazon and Uber groups", async () => {
      const amazonProvider = new AmazonCasualPurchaserProvider();
      const uberProvider = new UberOccasionalRiderProvider();

      const mockContext: ZkEmailContext = {};
      const amazonPayload = getMockPayload(["proof1"], "amazon");
      const uberPayload = getMockPayload(["proof1", "proof2", "proof3"], "uber");

      mockUnpackProof.mockImplementation(async (proof: string) => {
        // Return different subjects based on proof
        if (amazonPayload.proofs?.amazonProofs?.includes(proof)) {
          return createMockProofWithSubject("Your Amazon order shipped", MOCK_ADDRESS_NORMALIZED, true);
        }
        return createMockProofWithSubject("Your trip receipt from Uber", MOCK_ADDRESS_NORMALIZED, true);
      });

      await amazonProvider.verify(amazonPayload, mockContext);
      await uberProvider.verify(uberPayload, mockContext);

      // Verify both caches exist independently
      expect(mockContext.zkemail?.amazon).toBeDefined();
      expect(mockContext.zkemail?.uber).toBeDefined();
      expect(mockContext.zkemail?.amazon?.unpackedProofs).not.toBe(mockContext.zkemail?.uber?.unpackedProofs);
    });

    it("should cache subject-filtered proofs independently", async () => {
      // Setup: 100 proofs, only 30 have valid Amazon subjects
      mockUnpackProof.mockImplementation(async (proof: string) => {
        const index = parseInt(proof.replace("proof", ""));
        // First 30 have valid subjects, rest don't
        const subject = index < 30 ? "Your Amazon order shipped" : "Random newsletter";
        return createMockProofWithSubject(subject, MOCK_ADDRESS_NORMALIZED, true);
      });

      const mockContext: ZkEmailContext = {};
      const proofArray = Array(100)
        .fill(0)
        .map((_, i) => `proof${i}`);
      const payload = getMockPayload(proofArray, "amazon");
      payload.types = ["ZKEmail#AmazonCasualPurchaser"];

      const provider = new AmazonCasualPurchaserProvider();
      await provider.verify(payload, mockContext);

      // Verify filtering happened and was cached
      expect(mockContext.zkemail?.amazon?.unpackedProofs).toHaveLength(100);
      expect(mockContext.zkemail?.amazon?.subjectFilteredProofs).toHaveLength(30);
    });

    it("should not reuse cache from previous request (request-scoped behavior)", async () => {
      const provider = new AmazonCasualPurchaserProvider();
      const payload = getMockPayload(["proof1"], "amazon");

      mockUnpackProof.mockImplementation(async () =>
        createMockProofWithSubject("Your Amazon order shipped", MOCK_ADDRESS_NORMALIZED, true)
      );

      // First request
      const context1: ZkEmailContext = {};
      await provider.verify(payload, context1);
      expect(context1.zkemail?.amazon).toBeDefined();

      // Second request with new context (simulating new HTTP request)
      const context2: ZkEmailContext = {};
      await provider.verify(payload, context2);

      // Contexts should be independent
      expect(context2.zkemail?.amazon).toBeDefined();
      expect(context1.zkemail?.amazon).not.toBe(context2.zkemail?.amazon);
    });

    it("should reuse verification results when cached", async () => {
      const mockContext: ZkEmailContext = {};
      const proofArray = Array(20)
        .fill(0)
        .map((_, i) => `proof${i}`);
      const payload = getMockPayload(proofArray, "amazon");
      payload.types = ["ZKEmail#AmazonCasualPurchaser", "ZKEmail#AmazonRegularCustomer"];

      // Track verify calls
      const verifyCalls: string[] = [];
      mockUnpackProof.mockImplementation(async (proof: string) => {
        const mockProof = createMockProofWithSubject("Your Amazon order shipped", MOCK_ADDRESS_NORMALIZED, true);
        const originalVerify = mockProof.verify;
        mockProof.verify = jest.fn(async () => {
          verifyCalls.push(proof);
          return originalVerify();
        });
        return mockProof;
      });

      const provider1 = new AmazonCasualPurchaserProvider();
      const provider2 = new AmazonRegularCustomerProvider();

      await provider1.verify(payload, mockContext);
      const verifyCallsAfterFirst = verifyCalls.length;

      await provider2.verify(payload, mockContext);
      const verifyCallsAfterSecond = verifyCalls.length;

      // Second provider should not trigger new verify calls
      expect(verifyCallsAfterFirst).toBeGreaterThan(0);
      expect(verifyCallsAfterSecond).toBe(verifyCallsAfterFirst); // No additional calls!
    });
  });

  // ==========================================================================
  // 2. Threshold Optimization
  // ==========================================================================

  describe("Threshold Optimization", () => {
    describe("getRequestedMaxThreshold", () => {
      it("should return highest Amazon threshold when multiple variants requested", () => {
        const types = [
          "ZKEmail#AmazonCasualPurchaser", // 1
          "ZKEmail#AmazonRegularCustomer", // 10
          "ZKEmail#AmazonHeavyUser", // 50
        ];

        const max = getRequestedMaxThreshold("amazon", types);
        expect(max).toBe(AMAZON_HEAVY_USER_THRESHOLD);
      });

      it("should return correct threshold for partial variant sets", () => {
        expect(getRequestedMaxThreshold("amazon", ["ZKEmail#AmazonCasualPurchaser"])).toBe(
          AMAZON_CASUAL_PURCHASER_THRESHOLD
        );
        expect(
          getRequestedMaxThreshold("amazon", ["ZKEmail#AmazonCasualPurchaser", "ZKEmail#AmazonRegularCustomer"])
        ).toBe(AMAZON_REGULAR_CUSTOMER_THRESHOLD);
      });

      it("should return highest Uber threshold", () => {
        const types = [
          "ZKEmail#UberOccasionalRider", // 3
          "ZKEmail#UberRegularRider", // 25
          "ZKEmail#UberPowerUser", // 75
        ];

        const max = getRequestedMaxThreshold("uber", types);
        expect(max).toBe(UBER_POWER_USER_THRESHOLD);
      });

      it("should return group max when no types provided", () => {
        expect(getRequestedMaxThreshold("amazon", undefined)).toBe(AMAZON_HEAVY_USER_THRESHOLD);
        expect(getRequestedMaxThreshold("amazon", [])).toBe(AMAZON_HEAVY_USER_THRESHOLD);
        expect(getRequestedMaxThreshold("uber", undefined)).toBe(UBER_POWER_USER_THRESHOLD);
      });

      it("should handle unordered type arrays", () => {
        const types = [
          "ZKEmail#AmazonHeavyUser", // 50 (should win)
          "ZKEmail#AmazonCasualPurchaser", // 1
          "ZKEmail#AmazonRegularCustomer", // 10
        ];

        const max = getRequestedMaxThreshold("amazon", types);
        expect(max).toBe(AMAZON_HEAVY_USER_THRESHOLD);
      });

      it("should return lowest threshold for partial Uber sets", () => {
        expect(getRequestedMaxThreshold("uber", ["ZKEmail#UberOccasionalRider"])).toBe(UBER_OCCASIONAL_RIDER_THRESHOLD);
        expect(getRequestedMaxThreshold("uber", ["ZKEmail#UberOccasionalRider", "ZKEmail#UberRegularRider"])).toBe(
          UBER_REGULAR_RIDER_THRESHOLD
        );
      });
    });

    it("should verify proofs only up to requested max threshold across variants", async () => {
      const mockContext: ZkEmailContext = {};
      const proofArray = Array(100)
        .fill(0)
        .map((_, i) => `proof${i}`);
      const payload = getMockPayload(proofArray, "amazon");
      payload.types = [
        "ZKEmail#AmazonCasualPurchaser", // needs 1
        "ZKEmail#AmazonRegularCustomer", // needs 10 (max = 10)
      ];

      // Track how many proofs were verified
      const verifiedProofs = new Set<string>();
      mockUnpackProof.mockImplementation(async (proof: string) => {
        const mockProof = createMockProofWithSubject("Your Amazon order shipped", MOCK_ADDRESS_NORMALIZED, true);
        const originalVerify = mockProof.verify;
        mockProof.verify = jest.fn(async () => {
          verifiedProofs.add(proof);
          return originalVerify();
        });
        return mockProof;
      });

      const provider1 = new AmazonCasualPurchaserProvider();
      await provider1.verify(payload, mockContext);

      // Should have verified up to 10 (not all 100)
      // With 8 concurrent workers, may verify a few extra before stopping
      expect(verifiedProofs.size).toBeLessThanOrEqual(AMAZON_REGULAR_CUSTOMER_THRESHOLD + 8); // Allow for concurrency buffer
      expect(verifiedProofs.size).toBeGreaterThanOrEqual(AMAZON_REGULAR_CUSTOMER_THRESHOLD); // At least the threshold

      // Cache stores actual count found (may be slightly higher due to concurrency)
      const cachedCount = mockContext.zkemail?.amazon?.validCountMaxUpTo;
      expect(cachedCount).toBeGreaterThanOrEqual(AMAZON_REGULAR_CUSTOMER_THRESHOLD);
      expect(cachedCount).toBeLessThan(AMAZON_REGULAR_CUSTOMER_THRESHOLD + 10); // Reasonable upper bound
    });
  });

  // ==========================================================================
  // 3. Parallel Verification with Early Exit
  // ==========================================================================

  describe("Parallel Verification with Early Exit", () => {
    describe("countVerifiedProofs", () => {
      it("should stop verification once target threshold is reached", async () => {
        // Create 100 slow proofs (10ms each = 1 second total if sequential)
        const slowProofs = Array(100)
          .fill(0)
          .map(() => ({
            verify: jest.fn(async () => {
              await new Promise((resolve) => setTimeout(resolve, 10));
              return true; // All valid
            }),
          }));

        const start = Date.now();
        const count = await countVerifiedProofs(slowProofs as unknown as Proof[], 10); // Stop at 10
        const duration = Date.now() - start;

        // With 8 workers, some may complete after threshold is met
        expect(count).toBeGreaterThanOrEqual(10);
        expect(count).toBeLessThan(30); // But should stop well before all 100

        // Should finish much faster than verifying all 100
        // With 8 workers, should take ~2 batches
        expect(duration).toBeLessThan(300); // Way less than 1000ms

        // Verify not all proofs were checked
        const checkedCount = slowProofs.filter((p) => p.verify.mock.calls.length > 0).length;
        expect(checkedCount).toBeLessThan(100);
        expect(checkedCount).toBeGreaterThanOrEqual(10); // At least 10 checked
      });

      it("should verify all proofs when no stopAt specified", async () => {
        const proofs = Array(20)
          .fill(0)
          .map(() => ({
            verify: jest.fn().mockResolvedValue(true),
          }));

        const count = await countVerifiedProofs(proofs as unknown as Proof[]);

        expect(count).toBe(20);
        expect(proofs.every((p) => p.verify.mock.calls.length === 1)).toBe(true);
      });

      it("should handle mixed valid/invalid proofs with early exit", async () => {
        // First 20 valid, next 80 invalid (ensures we have enough valid to reach threshold)
        const proofs = Array(100)
          .fill(0)
          .map((_, i) => ({
            verify: jest.fn().mockResolvedValue(i < 20),
          }));

        const count = await countVerifiedProofs(proofs as unknown as Proof[], 3);

        // Should find 3 valid and stop (though concurrency may cause it to verify more)
        expect(count).toBeGreaterThanOrEqual(3);
        expect(count).toBeLessThan(20); // Should stop well before checking all valid proofs

        // Should have checked more than 3 (due to concurrency) but not all 100
        const checkedCount = proofs.filter((p) => p.verify.mock.calls.length > 0).length;
        expect(checkedCount).toBeGreaterThan(3);
        expect(checkedCount).toBeLessThan(50); // Should stop early
      });

      it("should respect maxConcurrency parameter", async () => {
        let currentlyRunning = 0;
        let maxConcurrent = 0;

        const proofs = Array(50)
          .fill(0)
          .map(() => ({
            verify: jest.fn(async () => {
              currentlyRunning++;
              maxConcurrent = Math.max(maxConcurrent, currentlyRunning);
              await new Promise((resolve) => setTimeout(resolve, 10));
              currentlyRunning--;
              return true;
            }),
          }));

        await countVerifiedProofs(proofs as unknown as Proof[], undefined, 4); // maxConcurrency = 4

        expect(maxConcurrent).toBeLessThanOrEqual(4);
        expect(maxConcurrent).toBeGreaterThan(0);
      });

      it("should continue verification when some proofs throw errors", async () => {
        const proofs = Array(20)
          .fill(0)
          .map((_, i) => ({
            verify: jest.fn(async () => {
              if (i % 5 === 0) throw new Error("Proof verification failed");
              return true;
            }),
          }));

        const count = await countVerifiedProofs(proofs as unknown as Proof[]);

        // 20 proofs, every 5th throws (4 errors), so 16 valid
        expect(count).toBe(16);
      });

      it("should handle all proofs failing gracefully", async () => {
        const proofs = Array(20)
          .fill(0)
          .map(() => ({
            verify: jest.fn().mockResolvedValue(false),
          }));

        const count = await countVerifiedProofs(proofs as unknown as Proof[]);

        expect(count).toBe(0);
        expect(proofs.every((p) => p.verify.mock.calls.length === 1)).toBe(true);
      });

      it("should abort remaining workers when threshold is met", async () => {
        // All proofs valid but slow
        const proofs = Array(100)
          .fill(0)
          .map(() => ({
            verify: jest.fn(async () => {
              await new Promise((resolve) => setTimeout(resolve, 20));
              return true;
            }),
          }));

        await countVerifiedProofs(proofs as unknown as Proof[], 5, 8);

        // Should have started checking more than 5 (due to 8 workers)
        // but much less than 100
        const checkedCount = proofs.filter((p) => p.verify.mock.calls.length > 0).length;
        expect(checkedCount).toBeGreaterThanOrEqual(5);
        expect(checkedCount).toBeLessThan(50); // Should abort early
      });
    });
  });

  // ==========================================================================
  // 4. Edge Cases
  // ==========================================================================

  describe("Edge Cases", () => {
    it("should pass when proof count exactly equals threshold", async () => {
      const provider = new AmazonRegularCustomerProvider(); // threshold: 10

      mockUnpackProof.mockImplementation(async () =>
        createMockProofWithSubject("Your Amazon order shipped", MOCK_ADDRESS_NORMALIZED, true)
      );

      const proofArray = Array(10)
        .fill(0)
        .map((_, i) => `proof${i}`);
      const payload = getMockPayload(proofArray, "amazon");

      const result = await provider.verify(payload);

      expect(result.valid).toBe(true);
      expect(result.record?.totalProofs).toBe("10");
    });

    it("should fail when proof count is one below threshold", async () => {
      const provider = new AmazonRegularCustomerProvider(); // threshold: 10

      // Only 9 valid proofs
      mockUnpackProof.mockImplementation(async (proof: string) => {
        const index = parseInt(proof.replace("proof", ""));
        return createMockProofWithSubject(
          "Your Amazon order shipped",
          MOCK_ADDRESS_NORMALIZED,
          index < 9 // First 9 are valid
        );
      });

      const proofArray = Array(10)
        .fill(0)
        .map((_, i) => `proof${i}`);
      const payload = getMockPayload(proofArray, "amazon");

      const result = await provider.verify(payload);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Need at least 10 valid amazon proofs, but only found 9");
    });

    it("should handle zero valid proofs gracefully", async () => {
      mockUnpackProof.mockImplementation(async () =>
        createMockProofWithSubject("Random email", MOCK_ADDRESS_NORMALIZED, false)
      );

      const provider = new AmazonCasualPurchaserProvider();
      const proofArray = Array(50)
        .fill(0)
        .map((_, i) => `proof${i}`);
      const payload = getMockPayload(proofArray, "amazon");

      const result = await provider.verify(payload);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("No valid amazon proofs found");
    });

    it("should cache zero count and reuse across variants", async () => {
      // All proofs fail subject filtering
      mockUnpackProof.mockImplementation(async () =>
        createMockProofWithSubject("Newsletter", MOCK_ADDRESS_NORMALIZED, true)
      );

      const mockContext: ZkEmailContext = {};
      const proofArray = Array(50)
        .fill(0)
        .map((_, i) => `proof${i}`);
      const payload = getMockPayload(proofArray, "amazon");
      payload.types = ["ZKEmail#AmazonCasualPurchaser", "ZKEmail#AmazonRegularCustomer"];

      const provider1 = new AmazonCasualPurchaserProvider();
      const provider2 = new AmazonRegularCustomerProvider();

      const result1 = await provider1.verify(payload, mockContext);
      const result2 = await provider2.verify(payload, mockContext);

      expect(result1.valid).toBe(false);
      expect(result2.valid).toBe(false);
      expect(mockContext.zkemail?.amazon?.validCountMaxUpTo).toBe(0);
    });

    it("should handle single proof correctly", async () => {
      mockUnpackProof.mockImplementation(async () =>
        createMockProofWithSubject("Your Amazon order shipped", MOCK_ADDRESS_NORMALIZED, true)
      );

      const provider = new AmazonCasualPurchaserProvider(); // threshold: 1
      const payload = getMockPayload(["proof1"], "amazon");

      const result = await provider.verify(payload);

      expect(result.valid).toBe(true);
      expect(result.record?.totalProofs).toBe("1");
    });

    it("should handle large proof sets efficiently with caching", async () => {
      mockUnpackProof.mockImplementation(async () =>
        createMockProofWithSubject("Your Amazon order shipped", MOCK_ADDRESS_NORMALIZED, true)
      );

      const mockContext: ZkEmailContext = {};
      const largeProofSet = Array(200)
        .fill(0)
        .map((_, i) => `proof${i}`);
      const payload = getMockPayload(largeProofSet, "amazon");
      payload.types = ["ZKEmail#AmazonCasualPurchaser", "ZKEmail#AmazonHeavyUser"];

      const start = Date.now();

      const provider1 = new AmazonCasualPurchaserProvider();
      await provider1.verify(payload, mockContext);

      const provider2 = new AmazonHeavyUserProvider();
      await provider2.verify(payload, mockContext);

      const duration = Date.now() - start;

      // Second provider should be nearly instant due to caching
      // Total time should be much less than verifying 200 proofs twice
      expect(duration).toBeLessThan(5000); // Reasonable threshold

      // Verify cache was used
      expect(mockContext.zkemail?.amazon?.unpackedProofs).toHaveLength(200);
      expect(mockContext.zkemail?.amazon?.validCountMaxUpTo).toBeDefined();
    });

    it("should handle threshold at boundary (exactly 50 for heavy user)", async () => {
      mockUnpackProof.mockImplementation(async () =>
        createMockProofWithSubject("Your Amazon order shipped", MOCK_ADDRESS_NORMALIZED, true)
      );

      const provider = new AmazonHeavyUserProvider(); // threshold: 50
      const proofArray = Array(50)
        .fill(0)
        .map((_, i) => `proof${i}`);
      const payload = getMockPayload(proofArray, "amazon");

      const result = await provider.verify(payload);

      expect(result.valid).toBe(true);
      expect(result.record?.totalProofs).toBe("50");
    });

    it("should fail heavy user with 49 valid proofs", async () => {
      mockUnpackProof.mockImplementation(async (proof: string) => {
        const index = parseInt(proof.replace("proof", ""));
        return createMockProofWithSubject(
          "Your Amazon order shipped",
          MOCK_ADDRESS_NORMALIZED,
          index < 49 // Only 49 valid
        );
      });

      const provider = new AmazonHeavyUserProvider(); // threshold: 50
      const proofArray = Array(50)
        .fill(0)
        .map((_, i) => `proof${i}`);
      const payload = getMockPayload(proofArray, "amazon");

      const result = await provider.verify(payload);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Need at least 50 valid amazon proofs, but only found 49");
    });

    it("should handle all three Uber tiers with same context", async () => {
      mockUnpackProof.mockImplementation(async () =>
        createMockProofWithSubject("Your trip receipt from Uber", MOCK_ADDRESS_NORMALIZED, true)
      );

      const mockContext: ZkEmailContext = {};
      const proofArray = Array(75)
        .fill(0)
        .map((_, i) => `proof${i}`);
      const payload = getMockPayload(proofArray, "uber");
      payload.types = ["ZKEmail#UberOccasionalRider", "ZKEmail#UberRegularRider", "ZKEmail#UberPowerUser"];

      const provider1 = new UberOccasionalRiderProvider();
      const provider2 = new UberRegularRiderProvider();
      const provider3 = new UberPowerUserProvider();

      const result1 = await provider1.verify(payload, mockContext);
      const result2 = await provider2.verify(payload, mockContext);
      const result3 = await provider3.verify(payload, mockContext);

      expect(result1.valid).toBe(true);
      expect(result2.valid).toBe(true);
      expect(result3.valid).toBe(true);

      // All should report same total from cache
      expect(result1.record?.totalProofs).toBe("75");
      expect(result2.record?.totalProofs).toBe("75");
      expect(result3.record?.totalProofs).toBe("75");
    });

    it("should handle mixed valid count scenarios across tiers", async () => {
      // Exactly 25 valid proofs - passes occasional and regular, fails power user
      mockUnpackProof.mockImplementation(async (proof: string) => {
        const index = parseInt(proof.replace("proof", ""));
        return createMockProofWithSubject(
          "Your trip receipt from Uber",
          MOCK_ADDRESS_NORMALIZED,
          index < 25 // Only first 25 valid
        );
      });

      const mockContext: ZkEmailContext = {};
      const proofArray = Array(100)
        .fill(0)
        .map((_, i) => `proof${i}`);
      const payload = getMockPayload(proofArray, "uber");
      payload.types = ["ZKEmail#UberOccasionalRider", "ZKEmail#UberRegularRider", "ZKEmail#UberPowerUser"];

      const provider1 = new UberOccasionalRiderProvider(); // needs 3
      const provider2 = new UberRegularRiderProvider(); // needs 25
      const provider3 = new UberPowerUserProvider(); // needs 75

      const result1 = await provider1.verify(payload, mockContext);
      const result2 = await provider2.verify(payload, mockContext);
      const result3 = await provider3.verify(payload, mockContext);

      expect(result1.valid).toBe(true);
      expect(result2.valid).toBe(true);
      expect(result3.valid).toBe(false);
      expect(result3.errors).toContain("Need at least 75 valid uber proofs, but only found 25");
    });
  });
});
