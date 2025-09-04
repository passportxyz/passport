import { BaseHumanIDPlatform } from "../BaseHumanIDPlatform.js";
import { PlatformOptions } from "../../../types.js";

import { CredentialType } from "@holonym-foundation/human-id-sdk";

// Mock the SDK functions
jest.mock("@holonym-foundation/human-id-sdk", () => ({
  setOptimismRpcUrl: jest.fn(),
  initHumanID: jest.fn(),
  CredentialType: jest.fn(),
}));

// Create test implementations
class TestSBTPlatform extends BaseHumanIDPlatform {
  platformId = "TestSBT";
  path = "TestSBT";
  credentialType: CredentialType = "test-sbt" as CredentialType;
  sbtFetcher = jest.fn();
}

class TestAttestationPlatform extends BaseHumanIDPlatform {
  platformId = "TestAttestation";
  path = "TestAttestation";
  credentialType: CredentialType = "test-attestation" as CredentialType;
  attestationFetcher = jest.fn();
}

describe("BaseHumanIDPlatform", () => {
  let originalEnv: any;

  beforeEach(() => {
    originalEnv = process.env;
    process.env = { ...originalEnv };
    process.env.NEXT_PUBLIC_PASSPORT_OP_RPC_URL = "https://test-rpc.com";
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  describe("credentialChecker", () => {
    describe("SBT path", () => {
      let platform: TestSBTPlatform;

      beforeEach(() => {
        platform = new TestSBTPlatform({} as PlatformOptions);
      });

      it("should return true for valid SBT with correct publicValues", async () => {
        platform.sbtFetcher = jest.fn().mockResolvedValue({
          expiry: BigInt(Math.floor(Date.now() / 1000) + 3600), // 1 hour from now
          publicValues: [BigInt(1), BigInt(2), BigInt(3), BigInt(4), BigInt(5)],
          revoked: false,
        });

        const result = await platform.credentialChecker("0x1234567890123456789012345678901234567890");
        expect(result).toBe(true);
      });

      it("should return false for SBT with insufficient publicValues", async () => {
        platform.sbtFetcher = jest.fn().mockResolvedValue({
          expiry: BigInt(Math.floor(Date.now() / 1000) + 3600),
          publicValues: [BigInt(1), BigInt(2)], // Only 2 values
          revoked: false,
        });

        const result = await platform.credentialChecker("0x1234567890123456789012345678901234567890");
        expect(result).toBe(false);
      });

      it("should return false for expired SBT", async () => {
        platform.sbtFetcher = jest.fn().mockResolvedValue({
          expiry: BigInt(Math.floor(Date.now() / 1000) - 3600), // 1 hour ago
          publicValues: [BigInt(1), BigInt(2), BigInt(3), BigInt(4), BigInt(5)],
          revoked: false,
        });

        const result = await platform.credentialChecker("0x1234567890123456789012345678901234567890");
        expect(result).toBe(false);
      });

      it("should return false for revoked SBT", async () => {
        platform.sbtFetcher = jest.fn().mockResolvedValue({
          expiry: BigInt(Math.floor(Date.now() / 1000) + 3600),
          publicValues: [BigInt(1), BigInt(2), BigInt(3), BigInt(4), BigInt(5)],
          revoked: true,
        });

        const result = await platform.credentialChecker("0x1234567890123456789012345678901234567890");
        expect(result).toBe(false);
      });

      it("should return false when sbtFetcher throws", async () => {
        platform.sbtFetcher = jest.fn().mockRejectedValue(new Error("SBT not found"));

        const result = await platform.credentialChecker("0x1234567890123456789012345678901234567890");
        expect(result).toBe(false);
      });

      it("should return false for null SBT", async () => {
        platform.sbtFetcher = jest.fn().mockResolvedValue(null);

        const result = await platform.credentialChecker("0x1234567890123456789012345678901234567890");
        expect(result).toBe(false);
      });
    });

    describe("Attestation path", () => {
      let platform: TestAttestationPlatform;

      beforeEach(() => {
        platform = new TestAttestationPlatform({} as PlatformOptions);
      });

      it("should return true for valid attestation with indexingValue", async () => {
        platform.attestationFetcher = jest.fn().mockResolvedValue({
          indexingValue: "valid-index-123",
          // other attestation fields...
        });

        const result = await platform.credentialChecker("0x1234567890123456789012345678901234567890");
        expect(result).toBe(true);
      });

      it("should return false for attestation without indexingValue", async () => {
        platform.attestationFetcher = jest.fn().mockResolvedValue({
          indexingValue: null,
          // other attestation fields...
        });

        const result = await platform.credentialChecker("0x1234567890123456789012345678901234567890");
        expect(result).toBe(false);
      });

      it("should return false when attestationFetcher throws", async () => {
        platform.attestationFetcher = jest.fn().mockRejectedValue(new Error("Attestation not found"));

        const result = await platform.credentialChecker("0x1234567890123456789012345678901234567890");
        expect(result).toBe(false);
      });

      it("should return false for null attestation", async () => {
        platform.attestationFetcher = jest.fn().mockResolvedValue(null);

        const result = await platform.credentialChecker("0x1234567890123456789012345678901234567890");
        expect(result).toBe(false);
      });
    });

    describe("Address validation", () => {
      let platform: TestSBTPlatform;

      beforeEach(() => {
        platform = new TestSBTPlatform({} as PlatformOptions);
      });

      it("should return false for invalid address format", async () => {
        platform.sbtFetcher = jest.fn();

        const result = await platform.credentialChecker("not-a-valid-address");
        expect(result).toBe(false);
        expect(platform.sbtFetcher).not.toHaveBeenCalled();
      });

      it("should return false for address without 0x prefix", async () => {
        platform.sbtFetcher = jest.fn();

        const result = await platform.credentialChecker("1234567890123456789012345678901234567890");
        expect(result).toBe(false);
        expect(platform.sbtFetcher).not.toHaveBeenCalled();
      });

      it("should return false for too short address", async () => {
        platform.sbtFetcher = jest.fn();

        const result = await platform.credentialChecker("0x123");
        expect(result).toBe(false);
        expect(platform.sbtFetcher).not.toHaveBeenCalled();
      });
    });

    describe("Platform without fetcher", () => {
      it("should throw error if neither sbtFetcher nor attestationFetcher is defined", async () => {
        class InvalidPlatform extends BaseHumanIDPlatform {
          platformId = "Invalid";
          path = "Invalid";
          credentialType: CredentialType = "invalid" as CredentialType;
          // No fetcher defined
        }

        const platform = new InvalidPlatform({} as PlatformOptions);

        await expect(platform.credentialChecker("0x1234567890123456789012345678901234567890")).rejects.toThrow(
          "Platform must define either sbtFetcher or attestationFetcher"
        );
      });
    });
  });
});
