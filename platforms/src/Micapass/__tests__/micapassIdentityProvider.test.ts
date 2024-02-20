// ---- Test subject
import { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import { ProviderExternalVerificationError } from "../../types";
import { MicapassIdentityProvider } from "../Providers";

// ----- Libs
import axios from "axios";

jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;

const MOCK_ADDRESS = "0xb4b6f1c68be31841b52f4015a31d1f38b99cdb71";
const MOCK_ADDRESS_LOWER = MOCK_ADDRESS.toLowerCase();
const MOCK_IDENTITY_ADDRESS = "0x6905ab6992b15118eF29D318A959aAfEA2256041";
const MOCK_IDENTITY_ADDRESS_LOWER = MOCK_IDENTITY_ADDRESS.toLowerCase();

describe("Attempt verification", function () {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns valid==true when when the user's identity is deployed", async function () {
    mockedAxios.get.mockResolvedValueOnce({
      status: 200,
      data: {
        valid: true,
        data: { identity: MOCK_IDENTITY_ADDRESS },
      },
    });

    const micapass = new MicapassIdentityProvider();
    const verifiedPayload: VerifiedPayload = await micapass.verify({
      address: MOCK_ADDRESS,
    } as RequestPayload);

    expect(verifiedPayload.valid).toBe(true);
    expect(verifiedPayload.record?.address).toBe(MOCK_ADDRESS_LOWER);
    expect(verifiedPayload.record?.identityAddress).toBe(MOCK_IDENTITY_ADDRESS_LOWER);
  });

  it("includes proper expiration duration if provided", async function () {
    const expiresIn = 60 * 60 * 24 * 10;
    mockedAxios.get.mockResolvedValueOnce({
      status: 200,
      data: {
        valid: true,
        data: { identity: MOCK_IDENTITY_ADDRESS, expiresIn: expiresIn },
      },
    });

    const micapass = new MicapassIdentityProvider();
    const verifiedPayload: VerifiedPayload = await micapass.verify({
      address: MOCK_ADDRESS,
    } as RequestPayload);

    expect(verifiedPayload.expiresInSeconds).toBe(expiresIn);
  });

  it("includes record data for successful verification", async function () {
    const mockIdentityAddress = "0x6905ab6992b15118eF29D318A959aAfEA2256041";
    mockedAxios.get.mockResolvedValueOnce({
      status: 200,
      data: {
        valid: true,
        data: {
          identity: mockIdentityAddress,
          record: {
            // eslint-disable-next-line prettier/prettier
            "test_data": "test_data_value",
          },
        },
      },
    });

    const micapass = new MicapassIdentityProvider();
    const verifiedPayload: VerifiedPayload = await micapass.verify({
      address: MOCK_ADDRESS,
    } as RequestPayload);
    expect(verifiedPayload.valid).toBe(true);
    expect(verifiedPayload.record?.test_data).toBe("test_data_value");
  });

  it("fails verification for non-registered users", async function () {
    mockedAxios.get.mockResolvedValueOnce({
      status: 400,
      data: {
        valid: false,
        data: undefined,
      },
    });

    const micapass = new MicapassIdentityProvider();
    const verifiedPayload: VerifiedPayload = await micapass.verify({
      address: MOCK_ADDRESS,
    } as RequestPayload);

    expect(verifiedPayload.valid).toBe(false);
    expect(verifiedPayload.errors).toContain("User has not deployed identity yet.");
  });

  it("fails verification for malformed backend response", async function () {
    mockedAxios.get.mockResolvedValueOnce({
      status: 400,
      data: {
        valid: undefined,
        data: undefined,
      },
    });

    const micapass = new MicapassIdentityProvider();
    const verifiedPayload: VerifiedPayload = await micapass.verify({
      address: MOCK_ADDRESS,
    } as RequestPayload);

    expect(verifiedPayload.valid).toBe(false);
    expect(verifiedPayload.errors).toContain("User's identity verification failed.");
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

    const micapass = new MicapassIdentityProvider();
    await expect(async () => {
      return await micapass.verify({
        address: "0x00000",
      } as RequestPayload);
    }).rejects.toThrow(ProviderExternalVerificationError);
  });
});
