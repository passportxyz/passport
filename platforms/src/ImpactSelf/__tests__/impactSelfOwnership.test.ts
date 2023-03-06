// ---- Test subject
import { RequestPayload } from "@gitcoin/passport-types";
import { ImpactSelfOwnershipProvider } from "../Providers/impactSelfOwnership";

const mockGetUserData = jest.fn();
jest.mock("ethers", () => {
  return {
    Contract: jest.fn().mockImplementation(() => {
      return {
        getUserData: mockGetUserData,
      };
    }),
  };
});

const MOCK_ADDRESS = "0x738488886dd94725864ae38252a90be1ab7609c7";
const MOCK_ADDRESS_LOWER = MOCK_ADDRESS.toLowerCase();
const MOCK_FAKE_ADDRESS = "fake_address";

const MOCK_OWNED_TRUE = {
  isOwner: true,
  score: { _hex: "0x00", _isBigNumber: true },
  scores: [{ _hex: "0x00", _isBigNumber: true }],
};
const MOCK_OWNED_FALSE = {
  isOwner: false,
  score: { _hex: "0x00", _isBigNumber: true },
  scores: [{ _hex: "0x00", _isBigNumber: true }],
};

describe("Attempt verification", function () {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserData.mockResolvedValue(MOCK_OWNED_TRUE);
  });

  it("should return true for an address with an Impact Self", async () => {
    const impactSelfProvider = new ImpactSelfOwnershipProvider();
    const verifiedPayload = await impactSelfProvider.verify({
      address: MOCK_ADDRESS_LOWER,
    } as RequestPayload);

    expect(mockGetUserData).toBeCalledWith(MOCK_ADDRESS_LOWER);
    expect(verifiedPayload).toEqual({
      valid: true,
      record: {
        address: MOCK_ADDRESS_LOWER,
        isImpactSelfOwner: "true",
      },
    });
  });

  it("should return false for an improper address", async () => {
    mockGetUserData.mockRejectedValueOnce(MOCK_FAKE_ADDRESS);
    const impactSelfProvider = new ImpactSelfOwnershipProvider();
    const verifiedPayload = await impactSelfProvider.verify({
      address: MOCK_FAKE_ADDRESS,
    } as RequestPayload);

    expect(mockGetUserData).toBeCalledWith(MOCK_FAKE_ADDRESS);
    expect(verifiedPayload).toEqual({
      valid: false,
      error: ["Impact Self provider get user ownership error"],
    });
  });

  it("should return an error response when getUserData throws an error", async () => {
    mockGetUserData.mockRejectedValueOnce(new Error("some error"));
    const impactSelfProvider = new ImpactSelfOwnershipProvider();
    const verifiedPayload = await impactSelfProvider.verify({
      address: MOCK_ADDRESS_LOWER,
    } as RequestPayload);

    expect(mockGetUserData).toBeCalledWith(MOCK_ADDRESS_LOWER);
    expect(verifiedPayload).toEqual({
      valid: false,
      error: ["Impact Self provider get user ownership error"],
    });
  });

  it("should return false for an address that does not have an Impact Self", async () => {
    mockGetUserData.mockResolvedValueOnce(MOCK_OWNED_FALSE);
    const impactSelfProvider = new ImpactSelfOwnershipProvider();
    const verifiedPayload = await impactSelfProvider.verify({
      address: MOCK_ADDRESS_LOWER,
    } as RequestPayload);

    expect(mockGetUserData).toBeCalledWith(MOCK_ADDRESS_LOWER);
    expect(verifiedPayload).toEqual({
      valid: false,
      record: {},
    });
  });
});
