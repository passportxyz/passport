// ---- Test subject
import { RequestPayload } from "@dpopp/types";
import { PohProvider } from "../src/providers/poh";

// ----- Ethers library
import { Contract } from "ethers";

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

// const IsRegisteredMock = jest.spyOn(Contract.prototype, "isRegistered");
var IsRegisteredMock = jest.fn();

describe("Attempt verification", function () {
  beforeEach(() => {
    jest.clearAllMocks();
    // mockIsRegistered.mockImplementation(async (address) => {
    //   if (address === MOCK_ADDRESS) return true;
    // });
  });

  it("should return true for an address registered with proof of humanity", async () => {
    mockIsRegistered.mockResolvedValueOnce(true);
    const poh = new PohProvider();
    const verifiedPayload = await poh.verify({
      address: MOCK_ADDRESS,
    } as RequestPayload);

    expect(mockIsRegistered).toBeCalledWith(MOCK_ADDRESS);
    expect(verifiedPayload).toEqual({
      valid: true,
      record: {
        poh: "Is registered",
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

    expect(mockIsRegistered).toBeCalledWith(UNREGISTERED_ADDRESS);
    expect(verifiedPayload).toEqual({
      valid: false,
    });
  });

  it("should return error response when isRegistered call errors", async () => {
    mockIsRegistered.mockRejectedValueOnce("some error");
    const UNREGISTERED_ADDRESS = "0xUNREGISTERED";

    const poh = new PohProvider();
    const verifiedPayload = await poh.verify({
      address: UNREGISTERED_ADDRESS,
    } as RequestPayload);

    expect(mockIsRegistered).toBeCalledWith(UNREGISTERED_ADDRESS);
    expect(verifiedPayload).toEqual({
      valid: false,
      error: [JSON.stringify("some error")],
    });
  });
});
