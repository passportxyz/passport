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
import { shouldContinueFetchingEmails } from "../utils.js";
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

const getMockPayload = (proofs: unknown, proofType: "amazon" | "uber"): RequestPayload =>
  ({
    address: MOCK_ADDRESS,
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

// Helper function to create mock proof with subject
const createMockProofWithSubject = (subject: string, verifyResult: boolean = true): object => ({
  verify: jest.fn().mockResolvedValue(verifyResult),
  getProofData: jest.fn().mockReturnValue({
    publicData: {
      subject: [subject],
    },
  }),
});

describe("ZKEmail Providers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the mock implementations to a default state before each test
    mockUnpackProof.mockImplementation(async (_proof) => createMockProofWithSubject("Your order confirmation", true));
    mockProofVerify.mockResolvedValue(true);
    mockGetProofData.mockReturnValue({
      publicData: {
        subject: ["Your order confirmation"],
      },
    });
  });

  describe("AmazonCasualPurchaserProvider", () => {
    it("should verify successfully with enough valid proofs", async () => {
      const provider = new AmazonCasualPurchaserProvider();

      // Mock proofs with Amazon-specific subjects
      mockUnpackProof.mockImplementation(async (_proof) =>
        createMockProofWithSubject("Your Amazon order confirmation", true)
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
        createMockProofWithSubject("Your Amazon order confirmation", false)
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
      // Mock proofs with valid Amazon subjects but failing verification
      const mockVerifyFn = jest.fn().mockRejectedValue(new Error("Verification failed"));
      mockUnpackProof.mockImplementation(async (_proof) => ({
        verify: mockVerifyFn,
        getProofData: jest.fn().mockReturnValue({
          publicData: {
            subject: ["Your Amazon order confirmation"],
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
        createMockProofWithSubject("Random newsletter subject", true)
      );

      const provider = new AmazonCasualPurchaserProvider();
      const payload = getMockPayload(["proof1", "proof2", "proof3"], "amazon");
      const result = await provider.verify(payload);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("No valid amazon proofs found");
    });
  });

  describe("UberOccasionalRiderProvider", () => {
    it("should verify successfully with enough valid proofs", async () => {
      const provider = new UberOccasionalRiderProvider();

      // Mock proofs with Uber-specific subjects
      mockUnpackProof.mockImplementation(async (_proof) =>
        createMockProofWithSubject("Your trip receipt from Uber", true)
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
        createMockProofWithSubject("Random promotional email", true)
      );

      const provider = new UberOccasionalRiderProvider();
      const payload = getMockPayload(["proof1", "proof2", "proof3"], "uber");
      const result = await provider.verify(payload);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("No valid uber proofs found");
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
});
