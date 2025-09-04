// ---- Test subject
import { RequestPayload } from "@gitcoin/passport-types";
import { BiometricsProvider } from "../Providers/Biometrics.js";
import { getBiometricsSBTByAddress, setOptimismRpcUrl } from "@holonym-foundation/human-id-sdk";

// Mock the SDK
jest.mock("@holonym-foundation/human-id-sdk", () => ({
  getBiometricsSBTByAddress: jest.fn(),
  setOptimismRpcUrl: jest.fn(),
}));

const mockedGetSBT = getBiometricsSBTByAddress as jest.MockedFunction<typeof getBiometricsSBTByAddress>;
const mockedSetRpcUrl = setOptimismRpcUrl as jest.MockedFunction<typeof setOptimismRpcUrl>;

const MOCK_ADDRESS = "0xb4b6f1c68be31841b52f4015a31d1f38b99cdb71";

describe("Attempt verification", function () {
  let originalEnv: any;

  beforeEach(() => {
    jest.clearAllMocks();
    originalEnv = process.env;
    process.env = { ...originalEnv };
    process.env.OPTIMISM_RPC_URL = "https://test-rpc.optimism.io";
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should return true when valid SBT is found", async () => {
    const mockNullifier = "123456789";
    mockedGetSBT.mockResolvedValueOnce({
      expiry: BigInt(Math.floor(Date.now() / 1000) + 3600), // 1 hour from now
      publicValues: [
        BigInt(1),
        BigInt(2),
        BigInt(3),
        BigInt(mockNullifier), // nullifier at index 3
        BigInt(5),
      ],
      revoked: false,
    } as any);

    const biometrics = new BiometricsProvider();
    const verifiedPayload = await biometrics.verify({
      address: MOCK_ADDRESS,
    } as RequestPayload);

    expect(mockedSetRpcUrl).toHaveBeenCalledWith("https://test-rpc.optimism.io");
    expect(mockedGetSBT).toHaveBeenCalledWith(MOCK_ADDRESS);
    expect(verifiedPayload).toEqual({
      valid: true,
      record: {
        nullifier: mockNullifier,
      },
    });
  });

  it("should return false when SBT is expired", async () => {
    mockedGetSBT.mockResolvedValueOnce({
      expiry: BigInt(Math.floor(Date.now() / 1000) - 3600), // 1 hour ago
      publicValues: [BigInt(1), BigInt(2), BigInt(3), BigInt(4), BigInt(5)],
      revoked: false,
    } as any);

    const biometrics = new BiometricsProvider();
    const verifiedPayload = await biometrics.verify({
      address: MOCK_ADDRESS,
    } as RequestPayload);

    expect(verifiedPayload.valid).toBe(false);
    expect(verifiedPayload.errors).toEqual(["biometrics SBT has expired"]);
  });

  it("should return false when SBT is revoked", async () => {
    mockedGetSBT.mockResolvedValueOnce({
      expiry: BigInt(Math.floor(Date.now() / 1000) + 3600),
      publicValues: [BigInt(1), BigInt(2), BigInt(3), BigInt(4), BigInt(5)],
      revoked: true,
    } as any);

    const biometrics = new BiometricsProvider();
    const verifiedPayload = await biometrics.verify({
      address: MOCK_ADDRESS,
    } as RequestPayload);

    expect(verifiedPayload.valid).toBe(false);
    expect(verifiedPayload.errors).toEqual(["biometrics SBT has been revoked"]);
  });

  it("should return false when no SBT is found", async () => {
    mockedGetSBT.mockResolvedValueOnce(null);

    const biometrics = new BiometricsProvider();
    const verifiedPayload = await biometrics.verify({
      address: MOCK_ADDRESS,
    } as RequestPayload);

    expect(verifiedPayload.valid).toBe(false);
    expect(verifiedPayload.errors).toEqual(["biometrics SBT not found"]);
  });

  it("should return false when SBT has insufficient public values", async () => {
    mockedGetSBT.mockResolvedValueOnce({
      expiry: BigInt(Math.floor(Date.now() / 1000) + 3600),
      publicValues: [BigInt(1), BigInt(2)], // Only 2 values instead of minimum 5
      revoked: false,
    } as any);

    const biometrics = new BiometricsProvider();
    const verifiedPayload = await biometrics.verify({
      address: MOCK_ADDRESS,
    } as RequestPayload);

    expect(verifiedPayload.valid).toBe(false);
    expect(verifiedPayload.errors).toEqual(["biometrics Invalid SBT public values"]);
  });

  it("should throw error when Optimism RPC URL is not configured", async () => {
    delete process.env.OPTIMISM_RPC_URL;

    const biometrics = new BiometricsProvider();

    await expect(
      biometrics.verify({
        address: MOCK_ADDRESS,
      } as RequestPayload)
    ).rejects.toThrow("Optimism RPC URL not configured");

    expect(mockedSetRpcUrl).not.toHaveBeenCalled();
    expect(mockedGetSBT).not.toHaveBeenCalled();
  });

  it("should throw error for invalid address format", async () => {
    const biometrics = new BiometricsProvider();

    await expect(
      biometrics.verify({
        address: "not-a-valid-hex-address",
      } as RequestPayload)
    ).rejects.toThrow("Invalid address format");

    expect(mockedGetSBT).not.toHaveBeenCalled();
  });

  it("should handle SDK errors gracefully", async () => {
    mockedGetSBT.mockRejectedValueOnce(new Error("Network error"));

    const biometrics = new BiometricsProvider();
    const verifiedPayload = await biometrics.verify({
      address: MOCK_ADDRESS,
    } as RequestPayload);

    // When getExistingSbt throws, it returns undefined, which then fails validation
    expect(verifiedPayload.valid).toBe(false);
    expect(verifiedPayload.errors).toEqual(["biometrics SBT not found"]);
  });
});
