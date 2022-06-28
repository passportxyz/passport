// ---- Test subject
import { GoodDollarProvider } from "../src/providers/gooddollar";

const MOCK_ADDRESS = "0x738488886dd94725864ae38252a90be1ab7609c2";
const MOCK_ADDRESS2 = "0x9E6Ea049A281F513a2BAbb106AF1E023FEEeCfA9";

const mockIsWhitelisted = jest.fn();

export const sampleGooddollarSignedObject = {
  a: { value: "0x9E6Ea049A281F513a2BAbb106AF1E023FEEeCfA9", attestation: "" },
  v: { value: true, attestation: "" },
  I: { value: "India", attestation: "" },
  n: { value: "Harjaap Dhillon", attestation: "" },
  e: { value: "harvydhillon16@gmail.com", attestation: "" },
  m: { value: "+918146851290", attestation: "" },
  nonce: { value: Date.now(), attestation: "" },
  sig: "0xadbf6657ff309f9f25dddf72d2d04ec3b0af053b2db9121910f79ea82bce486e1db26ea639670fa1600ce862e209845e1d2a73ad7a4a4e858a80dfa33f79e0ef1c",
};

const MOCK_REQUEST_PAYLOAD = {
  type: "GoodDollar",
  address: MOCK_ADDRESS,
  version: "0.0.0",
  proofs: {
    whitelistedAddress: MOCK_ADDRESS2,
    signedResponse: sampleGooddollarSignedObject,
  },
  challenge: "",
};

const MOCK_INVALID_REQUEST_PAYLOAD = {
  type: "GoodDollar",
  address: "0xUNREGISTERED",
  version: "0.0.0",
  proofs: {
    whitelistedAddress: "0xUNREGISTERED",
  },
  challenge: "",
};

jest.mock("ethers", () => {
  return {
    Contract: jest.fn().mockImplementation(() => {
      return {
        isWhitelisted: mockIsWhitelisted,
      };
    }),
  };
});

describe("Attempt verification", function () {
  it("should return true for an address whitelisted with gooddollar", async () => {
    mockIsWhitelisted.mockResolvedValueOnce(true);
    const gd = new GoodDollarProvider();
    const verifiedPayload = await gd.verify(MOCK_REQUEST_PAYLOAD as any);

    expect(mockIsWhitelisted).toBeCalledWith(MOCK_ADDRESS2);

    expect(verifiedPayload).toEqual({
      valid: true,
      record: {
        address: MOCK_ADDRESS,
        whitelistedAddress: MOCK_ADDRESS2,
      },
    });
  });

  it("should return false for an address that is not whitelisted with gooddollar", async () => {
    mockIsWhitelisted.mockResolvedValueOnce(false);
    const UNREGISTERED_ADDRESS = "0xUNREGISTERED";

    const gd = new GoodDollarProvider();
    const verifiedPayload = await gd.verify(MOCK_INVALID_REQUEST_PAYLOAD);

    expect(mockIsWhitelisted).toBeCalledWith(UNREGISTERED_ADDRESS);
    expect(verifiedPayload).toEqual({
      valid: false,
    });
  });

  it("should return error response when isWhitelisted call errors", async () => {
    mockIsWhitelisted.mockRejectedValueOnce("some error");
    const UNREGISTERED_ADDRESS = "0xUNREGISTERED";

    const gd = new GoodDollarProvider();
    const verifiedPayload = await gd.verify(MOCK_INVALID_REQUEST_PAYLOAD);

    expect(mockIsWhitelisted).toBeCalledWith(UNREGISTERED_ADDRESS);
    expect(verifiedPayload).toEqual({
      valid: false,
      error: [JSON.stringify("some error")],
    });
  });
});
