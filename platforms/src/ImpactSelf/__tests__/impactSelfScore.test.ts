// ---- Test subject
import { RequestPayload } from "@gitcoin/passport-types";
import { ImpactSelfScoreProvider } from "../Providers/impactSelfScore";

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

const MOCK_WITH_SCORE_EIGHT = {
  isOwner: true,
  score: { _hex: "0x08", _isBigNumber: true },
  scores: [{ _hex: "0x00", _isBigNumber: true }],
};

describe("Attempt verification", function () {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserData.mockResolvedValue(MOCK_WITH_SCORE_EIGHT);
  });

  it("should return true for an address with a score higher than the set value", async () => {
    const impactSelfProvider = new ImpactSelfScoreProvider({
      typeName: "ImpactSelf#Score#5",
      threshold: 5,
      error: "Impact Self Score > 5 provider error",
    });
    const verifiedPayload = await impactSelfProvider.verify({
      address: MOCK_ADDRESS_LOWER,
    } as RequestPayload);

    expect(mockGetUserData).toBeCalledWith(MOCK_ADDRESS_LOWER);
    expect(verifiedPayload).toEqual({
      valid: true,
      record: {
        address: MOCK_ADDRESS_LOWER,
        userScore: "8",
      },
    });
  });

  it("should return false for an improper address", async () => {
    mockGetUserData.mockRejectedValueOnce(MOCK_FAKE_ADDRESS);
    const impactSelfProvider = new ImpactSelfScoreProvider({
      typeName: "ImpactSelf#Score#5",
      threshold: 5,
      error: "Impact Self Score > 5 provider error",
    });
    const verifiedPayload = await impactSelfProvider.verify({
      address: MOCK_FAKE_ADDRESS,
    } as RequestPayload);

    expect(mockGetUserData).toBeCalledWith(MOCK_FAKE_ADDRESS);
    expect(verifiedPayload).toEqual({
      valid: false,
      error: ["Impact Self Score > 5 provider error"],
    });
  });

  it("should return an error response when getUserData throws an error", async () => {
    mockGetUserData.mockRejectedValueOnce(new Error("some error"));
    const impactSelfProvider = new ImpactSelfScoreProvider({
      typeName: "ImpactSelf#Score#5",
      threshold: 5,
      error: "Impact Self Score > 5 provider error",
    });
    const verifiedPayload = await impactSelfProvider.verify({
      address: MOCK_ADDRESS_LOWER,
    } as RequestPayload);

    expect(mockGetUserData).toBeCalledWith(MOCK_ADDRESS_LOWER);
    expect(verifiedPayload).toEqual({
      valid: false,
      error: ["Impact Self Score > 5 provider error"],
    });
  });

  it("should return false for an address with a score lower than the set value", async () => {
    const impactSelfProvider = new ImpactSelfScoreProvider({
      typeName: "ImpactSelf#Score#25",
      threshold: 25,
      error: "Impact Self Score > 25 provider error",
    });
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
