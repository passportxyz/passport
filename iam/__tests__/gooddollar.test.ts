// ---- Test subject
import { GoodDollarProvider } from "../src/providers/gooddollar";

jest.setTimeout(10000);
const MOCK_ADDRESS = "0x738488886dd94725864ae38252a90be1ab7609c2";
const MOCK_ADDRESS2 = "0x66582D24FEaD72555adaC681Cc621caCbB208324";

const mockIsWhitelisted = jest.fn();

export const sampleGooddollarSignedObject = {
  a: {
    value: "0x66582D24FEaD72555adaC681Cc621caCbB208324",
    attestation: "",
  },
  v: { value: true, attestation: "" },
  nonce: { value: 3312972836304, attestation: "" },
  sig: "0x50ddf850f78cce38563ae7146b88e616508d9ed547646c8a82a28e5c66fa078f7a4663a811e9580a6d2284a730234210b777cfe3835a2ec7aa79d8c6fe1280a01b",
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
const MOCK_NONLOGIN_REQUEST_PAYLOAD = {
  type: "GoodDollar",
  address: MOCK_ADDRESS2,
  version: "0.0.0",
  proofs: {
    whitelistedAddress: MOCK_ADDRESS2,
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
  it("should verify is address is whitelisted if verifying not through login with gooddollar", async () => {
    mockIsWhitelisted.mockResolvedValueOnce(true);
    const gd = new GoodDollarProvider();
    const verifiedPayload = await gd.verify(MOCK_NONLOGIN_REQUEST_PAYLOAD as any);
    expect(mockIsWhitelisted).toBeCalledWith(MOCK_ADDRESS2);

    expect(verifiedPayload).toEqual({
      valid: true,
      record: {
        address: MOCK_ADDRESS2,
        whitelistedAddress: MOCK_ADDRESS2,
      },
    });
  });

  it("should return true for an address whitelisted with gooddollar", async () => {
    const gd = new GoodDollarProvider();
    const verifiedPayload = await gd.verify(MOCK_REQUEST_PAYLOAD as any);

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
      error: ["whitelist address mismatch or not whitelisted", "{}"],
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
      error: [undefined, JSON.stringify("some error")],
    });
  });
});
