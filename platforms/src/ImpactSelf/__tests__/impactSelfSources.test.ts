// ---- Test subject
import { RequestPayload } from "@gitcoin/passport-types";
import { ImpactSelfActiveSourcesProvider } from "../Providers/impactSelfSources";

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

const MOCK_WITH_FOUR_SOURCES = {
  isOwner: true,
  score: { _hex: "0x08", _isBigNumber: true },
  scores: [
    // 5 sources scores are reported, but only the ones greater than 0 will be counted
    { _hex: "0x01", _isBigNumber: true },
    { _hex: "0x11", _isBigNumber: true },
    { _hex: "0x00", _isBigNumber: true },
    { _hex: "0x08", _isBigNumber: true },
    { _hex: "0x02", _isBigNumber: true },
  ],
};

describe("Attempt verification", function () {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserData.mockResolvedValue(MOCK_WITH_FOUR_SOURCES);
  });

  it("should return true for an address with a number of connected sources higher than the set value", async () => {
    const impactSelfProvider = new ImpactSelfActiveSourcesProvider({
      typeName: "ImpactSelf#ActiveSources#3",
      threshold: 3,
      error: "Impact Self Score > 3 provider error",
    });
    const verifiedPayload = await impactSelfProvider.verify({
      address: MOCK_ADDRESS_LOWER,
    } as RequestPayload);

    expect(mockGetUserData).toBeCalledWith(MOCK_ADDRESS_LOWER);
    expect(verifiedPayload).toEqual({
      valid: true,
      record: {
        address: MOCK_ADDRESS_LOWER,
        userActiveSources: "4",
      },
    });
  });

  it("should return false for an improper address", async () => {
    mockGetUserData.mockRejectedValueOnce(MOCK_FAKE_ADDRESS);
    const impactSelfProvider = new ImpactSelfActiveSourcesProvider({
      typeName: "ImpactSelf#ActiveSources#3",
      threshold: 3,
      error: "Impact Self Score > 3 provider error",
    });
    const verifiedPayload = await impactSelfProvider.verify({
      address: MOCK_FAKE_ADDRESS,
    } as RequestPayload);

    expect(mockGetUserData).toBeCalledWith(MOCK_FAKE_ADDRESS);
    expect(verifiedPayload).toEqual({
      valid: false,
      error: ["Impact Self Score > 3 provider error"],
    });
  });

  it("should return an error response when getUserData throws an error", async () => {
    mockGetUserData.mockRejectedValueOnce(new Error("some error"));
    const impactSelfProvider = new ImpactSelfActiveSourcesProvider({
      typeName: "ImpactSelf#ActiveSources#3",
      threshold: 3,
      error: "Impact Self Score > 3 provider error",
    });
    const verifiedPayload = await impactSelfProvider.verify({
      address: MOCK_ADDRESS_LOWER,
    } as RequestPayload);

    expect(mockGetUserData).toBeCalledWith(MOCK_ADDRESS_LOWER);
    expect(verifiedPayload).toEqual({
      valid: false,
      error: ["Impact Self Score > 3 provider error"],
    });
  });

  it("should return false for an address with a number of connected sources lower than the set value", async () => {
    const impactSelfProvider = new ImpactSelfActiveSourcesProvider({
      typeName: "ImpactSelf#ActiveSources#5",
      threshold: 5,
      error: "Impact Self Score > 5 provider error",
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
