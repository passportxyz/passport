// ---- Test subject
import { RequestPayload } from "@gitcoin/passport-types";

// Must set an RPC before loading the providers, contract responses will be mocked
process.env.OPTIMISM_RPC_URL = "https://rpc.ankr.com/optimism";
import {
  CoinpassportProvider,
  CoinpassportOver18Provider,
  CoinpassportOver21Provider,
  CoinpassportCountryProvider,
} from "../index";

const VALID_ADDRESS = "0x3333333333333333333333333333333333333333";
const INVALID_ADDRESS = "0x1111111111111111111111111111111111111111";
// One year in the future
const VALID_EXPIRATION = (Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365).toString();

const mocks = {
  addressExpiration: jest.fn(),
  isOver18: jest.fn(),
  isOver21: jest.fn(),
  getCountryCode: jest.fn(),
};
jest.mock("ethers", () => {
  return {
    Contract: jest.fn().mockImplementation(() => mocks),
  };
});

describe("Coinpassport", function () {
  it("retrieves expiration value", async () => {
    const provider = new CoinpassportProvider();
    mocks.addressExpiration.mockReturnValue(VALID_EXPIRATION);
    const resultValid = await provider.verify({
      address: VALID_ADDRESS,
    } as unknown as RequestPayload);

    expect(resultValid).toEqual({
      valid: true,
      record: {
        address: VALID_ADDRESS,
        expiration: VALID_EXPIRATION,
      },
    });

    mocks.addressExpiration.mockReturnValue("0");
    const resultInvalid = await provider.verify({
      address: INVALID_ADDRESS,
    } as unknown as RequestPayload);

    expect(resultInvalid).toEqual({
      valid: false,
      record: {
        address: INVALID_ADDRESS,
        expiration: "0",
      },
    });
  });

  it("retrieves over 18 value", async () => {
    const provider = new CoinpassportOver18Provider();
    mocks.isOver18.mockReturnValue(true);
    const resultValid = await provider.verify({
      address: VALID_ADDRESS,
    } as unknown as RequestPayload);

    expect(resultValid).toEqual({
      valid: true,
      record: {
        address: VALID_ADDRESS,
      },
    });

    mocks.isOver18.mockReturnValue(false);
    const resultInvalid = await provider.verify({
      address: INVALID_ADDRESS,
    } as unknown as RequestPayload);

    expect(resultInvalid).toEqual({
      valid: false,
      record: {
        address: INVALID_ADDRESS,
      },
    });
  });

  it("retrieves over 21 value", async () => {
    const provider = new CoinpassportOver21Provider();
    mocks.isOver21.mockReturnValue(true);
    const resultValid = await provider.verify({
      address: VALID_ADDRESS,
    } as unknown as RequestPayload);

    expect(resultValid).toEqual({
      valid: true,
      record: {
        address: VALID_ADDRESS,
      },
    });

    mocks.isOver21.mockReturnValue(false);
    const resultInvalid = await provider.verify({
      address: INVALID_ADDRESS,
    } as unknown as RequestPayload);

    expect(resultInvalid).toEqual({
      valid: false,
      record: {
        address: INVALID_ADDRESS,
      },
    });
  });

  it("retrieves country code value", async () => {
    const provider = new CoinpassportCountryProvider();
    mocks.getCountryCode.mockReturnValue(5570643);
    const resultValid = await provider.verify({
      address: VALID_ADDRESS,
    } as unknown as RequestPayload);

    expect(resultValid).toEqual({
      valid: true,
      record: {
        address: VALID_ADDRESS,
        country: "US",
      },
    });

    mocks.getCountryCode.mockReturnValue(0);
    const resultInvalid = await provider.verify({
      address: INVALID_ADDRESS,
    } as unknown as RequestPayload);

    expect(resultInvalid).toEqual({
      valid: false,
      record: {
        address: INVALID_ADDRESS,
      },
    });
  });
});
