import { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import { CleanHandsProvider } from "../index.js";
import { getCleanHandsSPAttestationByAddress } from "@holonym-foundation/human-id-sdk";

// Mock the SDK
jest.mock("@holonym-foundation/human-id-sdk", () => ({
  getCleanHandsSPAttestationByAddress: jest.fn(),
}));

const mockedGetAttestation = getCleanHandsSPAttestationByAddress as jest.MockedFunction<
  typeof getCleanHandsSPAttestationByAddress
>;

describe("CleanHandsProvider", function () {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockPayload: RequestPayload = {
    address: "0x0000000000000000000000000000000000000000",
    proofs: {
      code: "ABC123_ACCESSCODE",
    },
    type: "",
    version: "",
  };

  it("handles valid verification attempt", async () => {
    const mockIndexingValue = "valid-attestation-id-123";
    mockedGetAttestation.mockResolvedValue({
      indexingValue: mockIndexingValue,
      // Other attestation properties that might exist
      attestationId: "123",
      schemaId: "onchain_evm_10_0x8",
    } as any);

    const provider = new CleanHandsProvider();
    const result: VerifiedPayload = await provider.verify(mockPayload);

    expect(mockedGetAttestation).toHaveBeenCalledTimes(1);
    expect(mockedGetAttestation).toHaveBeenCalledWith(mockPayload.address);
    expect(result).toEqual({
      valid: true,
      record: { id: mockIndexingValue },
    });
  });

  it("handles attestation with no indexingValue", async () => {
    mockedGetAttestation.mockResolvedValue({
      // Missing indexingValue
      attestationId: "123",
      schemaId: "onchain_evm_10_0x8",
    } as any);

    const provider = new CleanHandsProvider();
    const result: VerifiedPayload = await provider.verify(mockPayload);

    expect(mockedGetAttestation).toHaveBeenCalledTimes(1);
    expect(mockedGetAttestation).toHaveBeenCalledWith(mockPayload.address);
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(["Clean Hands Invalid attestation - missing indexingValue"]);
  });

  it("handles null attestation", async () => {
    mockedGetAttestation.mockResolvedValue(null);

    const provider = new CleanHandsProvider();
    const result: VerifiedPayload = await provider.verify(mockPayload);

    expect(mockedGetAttestation).toHaveBeenCalledTimes(1);
    expect(mockedGetAttestation).toHaveBeenCalledWith(mockPayload.address);
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(["Clean Hands Attestation not found"]);
  });

  it("handles invalid address format", async () => {
    const invalidPayload: RequestPayload = {
      address: "not-a-valid-hex-address",
      proofs: {},
      type: "",
      version: "",
    };

    const provider = new CleanHandsProvider();
    const result: VerifiedPayload = await provider.verify(invalidPayload);

    expect(mockedGetAttestation).not.toHaveBeenCalled();
    expect(result).toEqual({
      valid: false,
      errors: ["Invalid address format"],
    });
  });

  it("handles attestation with empty indexingValue", async () => {
    mockedGetAttestation.mockResolvedValue({
      indexingValue: "",
      attestationId: "123",
      schemaId: "onchain_evm_10_0x8",
    } as any);

    const provider = new CleanHandsProvider();
    const result: VerifiedPayload = await provider.verify(mockPayload);

    expect(mockedGetAttestation).toHaveBeenCalledTimes(1);
    expect(mockedGetAttestation).toHaveBeenCalledWith(mockPayload.address);
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(["Clean Hands Invalid attestation - missing indexingValue"]);
  });

  it("should bubble up SDK errors", async () => {
    const errorMessage = "Network error from SDK";
    mockedGetAttestation.mockRejectedValue(new Error(errorMessage));

    const provider = new CleanHandsProvider();

    await expect(provider.verify(mockPayload)).rejects.toThrow(errorMessage);
    expect(mockedGetAttestation).toHaveBeenCalledTimes(1);
    expect(mockedGetAttestation).toHaveBeenCalledWith(mockPayload.address);
  });
});
