// ---- Test subject
import { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import { ProviderExternalVerificationError } from "../../types";
import { MicapassWalletScreeningProvider } from "../Providers";

// ----- Libs
import axios from "axios";

jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;

const MOCK_ADDRESS = "0xb4b6f1c68be31841b52f4015a31d1f38b99cdb71";

describe("Attempt verification", function () {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns valid==true when the user's proof has been verified", async function () {
    mockedAxios.get.mockResolvedValueOnce({
      status: 200,
      data: {
        valid: true,
        data: {},
      },
    });

    const micapass = new MicapassWalletScreeningProvider();
    const verifiedPayload: VerifiedPayload = await micapass.verify({
      address: MOCK_ADDRESS,
    } as RequestPayload);

    expect(verifiedPayload.valid).toBe(true);
    expect(verifiedPayload.record?.address).toBe(MOCK_ADDRESS);
  });

  it("includes proper expiration duration if provided", async function () {
    const expiresIn = 60 * 60 * 24 * 10;
    mockedAxios.get.mockResolvedValueOnce({
      status: 200,
      data: {
        valid: true,
        data: { expiresIn: expiresIn },
      },
    });

    const micapass = new MicapassWalletScreeningProvider();
    const verifiedPayload: VerifiedPayload = await micapass.verify({
      address: MOCK_ADDRESS,
    } as RequestPayload);

    expect(verifiedPayload.expiresInSeconds).toBe(expiresIn);
  });

  it("includes record data for successful verification", async function () {
    const expiresIn = 60 * 60 * 24 * 10;
    mockedAxios.get.mockResolvedValueOnce({
      status: 200,
      data: {
        valid: true,
        data: {
          expiresIn: expiresIn,
          record: {
            // eslint-disable-next-line prettier/prettier
            "test_data": "test_data_value",
          },
        },
      },
    });

    const micapass = new MicapassWalletScreeningProvider();
    const verifiedPayload: VerifiedPayload = await micapass.verify({
      address: MOCK_ADDRESS,
    } as RequestPayload);
    expect(verifiedPayload.valid).toBe(true);
    expect(verifiedPayload.record?.test_data).toBe("test_data_value");
  });

  it("fails verification for users that didn't pass KYC verification", async function () {
    mockedAxios.get.mockResolvedValueOnce({
      status: 400,
      data: {
        valid: false,
        data: undefined,
      },
    });

    const micapass = new MicapassWalletScreeningProvider();
    const verifiedPayload: VerifiedPayload = await micapass.verify({
      address: MOCK_ADDRESS,
    } as RequestPayload);

    expect(verifiedPayload.valid).toBe(false);
    expect(verifiedPayload.errors).toContain("User has no active wallet screeening proof.");
  });

  it("fails verification for malformed backend response", async function () {
    mockedAxios.get.mockResolvedValueOnce({
      status: 400,
      data: {
        valid: undefined,
        data: undefined,
      },
    });

    const micapass = new MicapassWalletScreeningProvider();
    const verifiedPayload: VerifiedPayload = await micapass.verify({
      address: MOCK_ADDRESS,
    } as RequestPayload);

    expect(verifiedPayload.valid).toBe(false);
    expect(verifiedPayload.errors).toContain("User's wallet screening proof verification failed.");
  });

  it("throws on backend status 5XX", async function () {
    mockedAxios.get.mockRejectedValueOnce({
      status: 500,
      response: {
        data: {
          error: "Internal Server Error",
        },
      },
    });

    const micapass = new MicapassWalletScreeningProvider();
    await expect(async () => {
      return await micapass.verify({
        address: "0x00000",
      } as RequestPayload);
    }).rejects.toThrow(ProviderExternalVerificationError);
  });
});
