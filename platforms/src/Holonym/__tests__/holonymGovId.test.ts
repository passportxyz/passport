// ---- Test subject
import { RequestPayload } from "@gitcoin/passport-types";
import { ProviderExternalVerificationError } from "../../types";
import { HolonymGovIdProvider } from "../Providers/holonymGovIdProvider";

const mockIsUniqueForAction = jest.fn();

jest.mock("ethers", () => {
  return {
    Contract: jest.fn().mockImplementation(() => {
      return {
        isUniqueForAction: mockIsUniqueForAction,
      };
    }),
  };
});

const MOCK_ADDRESS = "0xb4b6f1c68be31841b52f4015a31d1f38b99cdb71";
const actionId = 123456789;

describe("Attempt verification", function () {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return true for an address that has proven uniqueness to Holonym government ID Sybil resistance smart contract", async () => {
    mockIsUniqueForAction.mockResolvedValueOnce(true);
    const holonym = new HolonymGovIdProvider();
    const verifiedPayload = await holonym.verify({
      address: MOCK_ADDRESS,
    } as RequestPayload);

    expect(mockIsUniqueForAction).toBeCalledWith(MOCK_ADDRESS, actionId);
    expect(verifiedPayload).toEqual({
      valid: true,
      errors: [],
      record: {
        address: MOCK_ADDRESS,
      },
    });
  });

  it("should return false for an address that has not proven uniqueness to Holonym government ID Sybil resistance smart contract", async () => {
    mockIsUniqueForAction.mockResolvedValueOnce(false);
    const UNREGISTERED_ADDRESS = "0xunregistered";

    const holonym = new HolonymGovIdProvider();
    const verifiedPayload = await holonym.verify({
      address: UNREGISTERED_ADDRESS,
    } as RequestPayload);

    expect(mockIsUniqueForAction).toBeCalledWith(UNREGISTERED_ADDRESS, actionId);
    expect(verifiedPayload).toEqual({
      valid: false,
      errors: ["We were unable to verify that your address was unique for action -- isUniqueForAction: false."],
      record: undefined,
    });
  });

  it("should return error response when isUniqueForAction call errors", async () => {
    mockIsUniqueForAction.mockRejectedValueOnce("some error");
    const UNREGISTERED_ADDRESS = "0xunregistered";

    const holonym = new HolonymGovIdProvider();

    await expect(async () => {
      return await holonym.verify({
        address: UNREGISTERED_ADDRESS,
      } as RequestPayload);
    }).rejects.toThrow(ProviderExternalVerificationError);
  });
});
