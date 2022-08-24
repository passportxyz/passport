// ---- Test subject
import { RequestPayload } from "@gitcoin/passport-types";
import { LensProfileProvider } from "../src/providers/lens";

const mockDefaultProfile = jest.fn();
const mockGetHandle = jest.fn();

jest.mock("ethers", () => {
  return {
    Contract: jest.fn().mockImplementation(() => {
      return {
        defaultProfile: mockDefaultProfile,
        getHandle: mockGetHandle,
      };
    }),
  };
});

const MOCK_ADDRESS = "0x738488886dd94725864ae38252a90be1ab7609c7";
const MOCK_ADDRESS_LOWER = MOCK_ADDRESS.toLowerCase();
const MOCK_FAKE_ADDRESS = "fake_address";
// Decimal value is 999999999999
const MOCK_BIG_NUMBER = { _hex: "0x0E8D4A50FFF", _isBigNumber: true };
const MOCK_LENS_HANDLE = "mockLensHandle.lens";

describe("Attempt verification", function () {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return true for an address with a default lens name", async () => {
    mockDefaultProfile.mockResolvedValue(MOCK_BIG_NUMBER);
    mockGetHandle.mockResolvedValue(MOCK_LENS_HANDLE);
    const lens = new LensProfileProvider();
    const verifiedPayload = await lens.verify({
      address: MOCK_ADDRESS_LOWER,
    } as RequestPayload);

    expect(mockDefaultProfile).toBeCalledWith(MOCK_ADDRESS_LOWER);
    expect(mockGetHandle).toBeCalledWith(MOCK_BIG_NUMBER);
    expect(verifiedPayload).toEqual({
      valid: true,
      record: {
        address: MOCK_ADDRESS,
        userHandle: MOCK_LENS_HANDLE,
      },
    });
  });

  it("should return false for an improper address", async () => {
    mockDefaultProfile.mockRejectedValue(MOCK_FAKE_ADDRESS);
    const lens = new LensProfileProvider();
    const verifiedPayload = await lens.verify({
      address: MOCK_FAKE_ADDRESS,
    } as RequestPayload);

    expect(mockDefaultProfile).toBeCalledWith(MOCK_FAKE_ADDRESS);
    expect(verifiedPayload).toEqual({
      valid: false,
      error: ["Lens provider get user handle error"],
    });
  });

  it("should return an error response when defaultProfile throws an error", async () => {
    mockDefaultProfile.mockRejectedValue(new Error("some error"));
    const lens = new LensProfileProvider();
    const verifiedPayload = await lens.verify({
      address: MOCK_ADDRESS_LOWER,
    } as RequestPayload);

    expect(mockDefaultProfile).toBeCalledWith(MOCK_ADDRESS_LOWER);
    expect(verifiedPayload).toEqual({
      valid: false,
      error: ["Lens provider get user handle error"],
    });
  });

  it("should return an error response when getHandle throws an error", async () => {
    mockDefaultProfile.mockResolvedValue(MOCK_BIG_NUMBER);
    mockGetHandle.mockRejectedValue(new Error("some error"));
    const lens = new LensProfileProvider();
    const verifiedPayload = await lens.verify({
      address: MOCK_ADDRESS_LOWER,
    } as RequestPayload);

    expect(mockDefaultProfile).toBeCalledWith(MOCK_ADDRESS_LOWER);
    expect(verifiedPayload).toEqual({
      valid: false,
      error: ["Lens provider get user handle error"],
    });
  });
});
