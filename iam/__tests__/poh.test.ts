// ---- Test subject
import { RequestPayload } from "@dpopp/types";
import { PohProvider } from "../src/providers/poh";

// ----- Ethers library
import { Contract } from "ethers";

jest.mock("ethers", () => {
  // Require the original module to not be mocked...
  return jest.requireActual("ethers");
});

const MOCK_ADDRESS = "0x738488886dd94725864ae38252a90be1ab7609c7";

describe("Attempt verification", function () {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return true for an address registered with proof of humanity", async () => {
    const mockIsRegistered = jest.fn(() => new Promise((resolve) => resolve(true)));
    (Contract.prototype as any).isRegistered = mockIsRegistered;

    const poh = new PohProvider();

    const verifiedPayload = await poh.verify({
      address: MOCK_ADDRESS,
    } as RequestPayload);

    expect(mockIsRegistered).toBeCalledWith(MOCK_ADDRESS);
    expect(verifiedPayload).toEqual({
      valid: true,
      record: {
        poh: "Verified",
      },
    });
  });

  it("should return false for an address not registered with proof of humanity", async () => {
    const mockIsRegistered = jest.fn(() => new Promise((resolve) => resolve(false)));
    (Contract.prototype as any).isRegistered = mockIsRegistered;

    const poh = new PohProvider();

    const verifiedPayload = await poh.verify({
      address: MOCK_ADDRESS,
    } as RequestPayload);

    expect(mockIsRegistered).toBeCalledWith(MOCK_ADDRESS);
    expect(verifiedPayload).toEqual({
      valid: false,
      record: {
        poh: "NotVerified",
      },
    });
  });

  it("should return false for an incorrect address", async () => {
    const mockIsRegistered = jest.fn(
      () =>
        new Promise((_) => {
          throw "error";
        })
    );
    (Contract.prototype as any).isRegistered = mockIsRegistered;

    const poh = new PohProvider();

    const verifiedPayload = await poh.verify({
      address: MOCK_ADDRESS,
    } as RequestPayload);

    expect(mockIsRegistered).toBeCalledWith(MOCK_ADDRESS);
    expect(verifiedPayload).toEqual({
      valid: false,
    });
  });
});
