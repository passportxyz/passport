// ---- Test subject
import { RequestPayload } from "@gitcoin/passport-types";
import { ProviderExternalVerificationError } from "../../types";
import { PohProvider } from "../Providers/poh";

const mockIsRegistered = jest.fn();

jest.mock("ethers", () => {
  return {
    Contract: jest.fn().mockImplementation(() => {
      return {
        isRegistered: mockIsRegistered,
      };
    }),
  };
});

const MOCK_ADDRESS = "0x738488886dd94725864ae38252a90be1ab7609c7";

describe("Attempt verification", function () {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return true for an address registered with proof of humanity", async () => {
    mockIsRegistered.mockResolvedValueOnce(true);
    const poh = new PohProvider();
    const verifiedPayload = await poh.verify({
      address: MOCK_ADDRESS,
    } as RequestPayload);

    expect(mockIsRegistered).toHaveBeenCalledWith(MOCK_ADDRESS);
    expect(verifiedPayload).toEqual({
      valid: true,
      errors: [],
      record: {
        address: MOCK_ADDRESS,
      },
    });
  });

  it("should return false for an address not registered with proof of humanity", async () => {
    mockIsRegistered.mockResolvedValueOnce(false);
    const UNREGISTERED_ADDRESS = "0xUNREGISTERED";

    const poh = new PohProvider();
    const verifiedPayload = await poh.verify({
      address: UNREGISTERED_ADDRESS,
    } as RequestPayload);

    expect(mockIsRegistered).toHaveBeenCalledWith(UNREGISTERED_ADDRESS);
    expect(verifiedPayload).toEqual({
      errors: ["Your address is not registered with Proof of Humanity -- isRegistered: false."],
      valid: false,
    });
  });

  it("should return error response when isRegistered call errors", async () => {
    mockIsRegistered.mockRejectedValueOnce("some error");
    const UNREGISTERED_ADDRESS = "0xUNREGISTERED";

    const poh = new PohProvider();
    await expect(async () => {
      return await poh.verify({
        address: UNREGISTERED_ADDRESS,
      } as RequestPayload);
    }).rejects.toThrow(
      // eslint-disable-next-line quotes
      new ProviderExternalVerificationError('Error verifying Proof of Humanity: "some error".')
    );
  });
});
