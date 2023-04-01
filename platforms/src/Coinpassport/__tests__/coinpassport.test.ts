// Must set an RPC with valid responses before loading the provider module
process.env.OPTIMISM_RPC_URL = "https://rpc.ankr.com/optimism";

// ---- Test subject
import { RequestPayload } from "@gitcoin/passport-types";
import {
  CoinpassportProvider,
  CoinpassportOver18Provider,
  CoinpassportOver21Provider,
  CoinpassportCountryProvider,
} from "../index";

const VALID_ADDRESS = "0xa48c718AE6dE6599c5A46Fd6caBff54Def39473a";
const INVALID_ADDRESS = "0x1111111111111111111111111111111111111111";
const VALID_EXPIRATION = "1870300800";

describe("Coinpassport", function () {
  it("retrieves expiration value", async () => {
    const provider = new CoinpassportProvider();
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
    const resultValid = await provider.verify({
      address: VALID_ADDRESS,
    } as unknown as RequestPayload);

    expect(resultValid).toEqual({
      valid: true,
      record: {
        address: VALID_ADDRESS,
      },
    });

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
    const resultValid = await provider.verify({
      address: VALID_ADDRESS,
    } as unknown as RequestPayload);

    expect(resultValid).toEqual({
      valid: true,
      record: {
        address: VALID_ADDRESS,
      },
    });

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
