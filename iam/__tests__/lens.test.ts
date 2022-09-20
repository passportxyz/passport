// ---- Test subject
import { RequestPayload } from "@gitcoin/passport-types";
import { LensProfileProvider } from "../src/providers/lens";

const mockBalanceOf = jest.fn();
jest.mock("ethers", () => {
  return {
    Contract: jest.fn().mockImplementation(() => {
      return {
        balanceOf: mockBalanceOf,
      };
    }),
  };
});

const MOCK_ADDRESS = "0x738488886dd94725864ae38252a90be1ab7609c7";
const MOCK_ADDRESS_LOWER = MOCK_ADDRESS.toLowerCase();
const MOCK_FAKE_ADDRESS = "fake_address";

const MOCK_BIG_NUMBER_TWO = { _hex: "0x02", _isBigNumber: true };
const MOCK_BIG_NUMBER_ONE = { _hex: "0x01", _isBigNumber: true };
const MOCK_BIG_NUMBER_ZERO = { _hex: "0x00", _isBigNumber: true };

describe("Attempt verification", function () {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBalanceOf.mockResolvedValue(MOCK_BIG_NUMBER_TWO);
  });

  it("should return true for an address with more than one lens handle", async () => {
    const lens = new LensProfileProvider();
    const verifiedPayload = await lens.verify({
      address: MOCK_ADDRESS_LOWER,
    } as RequestPayload);

    expect(mockBalanceOf).toBeCalledWith(MOCK_ADDRESS_LOWER);
    expect(verifiedPayload).toEqual({
      valid: true,
      record: {
        address: MOCK_ADDRESS_LOWER,
        numberOfHandles: "2",
      },
    });
  });

  it("should return false for an improper address", async () => {
    mockBalanceOf.mockRejectedValueOnce(MOCK_FAKE_ADDRESS);
    const lens = new LensProfileProvider();
    const verifiedPayload = await lens.verify({
      address: MOCK_FAKE_ADDRESS,
    } as RequestPayload);

    expect(mockBalanceOf).toBeCalledWith(MOCK_FAKE_ADDRESS);
    expect(verifiedPayload).toEqual({
      valid: false,
      error: ["Lens provider get user handle error"],
    });
  });

  it("should return an error response when balanceOf throws an error", async () => {
    mockBalanceOf.mockRejectedValueOnce(new Error("some error"));
    const lens = new LensProfileProvider();
    const verifiedPayload = await lens.verify({
      address: MOCK_ADDRESS_LOWER,
    } as RequestPayload);

    expect(mockBalanceOf).toBeCalledWith(MOCK_ADDRESS_LOWER);
    expect(verifiedPayload).toEqual({
      valid: false,
      error: ["Lens provider get user handle error"],
    });
  });

  it("should return true for an address with one lens handle", async () => {
    mockBalanceOf.mockResolvedValueOnce(MOCK_BIG_NUMBER_ONE);
    const lens = new LensProfileProvider();
    const verifiedPayload = await lens.verify({
      address: MOCK_ADDRESS_LOWER,
    } as RequestPayload);

    expect(mockBalanceOf).toBeCalledWith(MOCK_ADDRESS_LOWER);
    expect(verifiedPayload).toEqual({
      valid: true,
      record: {
        address: MOCK_ADDRESS_LOWER,
        numberOfHandles: "1",
      },
    });
  });

  it("should return false for an address that does not have a lens handle", async () => {
    mockBalanceOf.mockResolvedValueOnce(MOCK_BIG_NUMBER_ZERO);
    const lens = new LensProfileProvider();
    const verifiedPayload = await lens.verify({
      address: MOCK_ADDRESS_LOWER,
    } as RequestPayload);

    expect(mockBalanceOf).toBeCalledWith(MOCK_ADDRESS_LOWER);
    expect(verifiedPayload).toEqual({
      valid: false,
      record: {},
    });
  });
});
