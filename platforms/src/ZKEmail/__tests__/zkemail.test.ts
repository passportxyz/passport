import { RequestPayload } from "@gitcoin/passport-types";
import {
  AmazonCasualPurchaserProvider,
  AmazonRegularCustomerProvider,
  AmazonHeavyUserProvider,
  UberOccasionalRiderProvider,
  UberRegularRiderProvider,
  UberPowerUserProvider,
} from "../Providers/zkemail.js";
import * as zkEmailSdk from "@zk-email/sdk";
import type { RawEmailResponse } from "@zk-email/sdk";
import { shouldContinueFetchingEmails, normalizeWalletAddress } from "../utils.js";
import { AMAZON_STOP_FETCH_LIMIT, UBER_STOP_FETCH_LIMIT } from "../types.js";

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

// Helper function to create mock proof with subject and wallet
const createMockProofWithSubject = (
  subject: string,
  walletAddress: string = MOCK_ADDRESS_NORMALIZED,
  verifyResult: boolean = true
): object => ({
  verify: jest.fn().mockResolvedValue(verifyResult),
  getProofData: jest.fn().mockReturnValue({
    publicData: {
      subject: [subject],
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
      createMockProofWithSubject("Your order confirmation", MOCK_ADDRESS_NORMALIZED, true)
    );
    mockProofVerify.mockResolvedValue(true);
    mockGetProofData.mockReturnValue({
      publicData: {
        subject: ["Your order confirmation"],
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
      // Mock proofs with valid Amazon subjects and wallet but failing verification
      const mockVerifyFn = jest.fn().mockRejectedValue(new Error("Verification failed"));
      mockUnpackProof.mockImplementation(async (_proof) => ({
        verify: mockVerifyFn,
        getProofData: jest.fn().mockReturnValue({
          publicData: {
            subject: ["Your Amazon order has shipped"],
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
      expect(result.errors).toContain("No wallet address provided in payload");
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
