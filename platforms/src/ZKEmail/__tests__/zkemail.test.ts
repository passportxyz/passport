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

jest.mock("@zk-email/sdk", () => ({
  initZkEmailSdk: jest.fn(),
}));

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

const mockSdk = {
  unPackProof: mockUnpackProof,
};

(zkEmailSdk.initZkEmailSdk as jest.Mock).mockReturnValue(mockSdk);

describe("ZKEmail Providers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the mock implementations to a default state before each test
    mockUnpackProof.mockImplementation(async (proof) => ({
      verify: mockProofVerify.mockResolvedValue(true),
    }));
    mockProofVerify.mockResolvedValue(true);
  });

  describe("AmazonCasualPurchaserProvider", () => {
    it("should verify successfully with enough valid proofs", async () => {
      const provider = new AmazonCasualPurchaserProvider();

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
      mockUnpackProof.mockResolvedValue({ verify: jest.fn().mockResolvedValue(false) });
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
      mockProofVerify.mockRejectedValue(new Error("Verification failed"));
      mockUnpackProof.mockResolvedValue({ verify: mockProofVerify });

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
  });

  describe("UberOccasionalRiderProvider", () => {
    it("should verify successfully with enough valid proofs", async () => {
      const provider = new UberOccasionalRiderProvider();
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
});
