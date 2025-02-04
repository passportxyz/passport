/* eslint-disable */
// ---- Test subject
import * as coinbaseProviderModule from "../Providers/coinbase.js";

import { RequestPayload } from "@gitcoin/passport-types";

// ----- Libs
import axios, { AxiosError } from "axios";

jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;

const validCoinbaseUserResponse = {
  data: {
    data: {
      id: "2348298637",
    },
  },
  status: 200,
};

const validCodeResponse = {
  data: {
    access_token: "cnbstkn294745627362562",
  },
  status: 200,
};

const schema = {
  id: coinbaseProviderModule.VERIFIED_ACCOUNT_SCHEMA,
};

const code = "ABC123_ACCESSCODE";
const clientId = process.env.COINBASE_CLIENT_ID;
const clientSecret = process.env.COINBASE_CLIENT_SECRET;
const callback = process.env.COINBASE_CALLBACK;

beforeEach(() => {
  jest.clearAllMocks();
  mockedAxios.post.mockImplementation(async (url, data, config) => {
    return validCodeResponse;
  });

  mockedAxios.get.mockImplementation(async (url, config) => {
    return validCoinbaseUserResponse;
  });
});

describe("verifyCoinbaseAttestation", () => {
  const testAddress = "0xTestAddress";
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return true for a valid attestation", async () => {
    const mockResponse = {
      data: {
        data: {
          attestations: [
            {
              recipient: testAddress,
              revocationTime: 0,
              revoked: false,
              expirationTime: 0, // 10 seconds in the future
              schema,
            },
          ],
        },
      },
    };

    mockedAxios.post.mockResolvedValueOnce(mockResponse);

    const result = await coinbaseProviderModule.verifyCoinbaseAttestation(testAddress);

    expect(result).toBe(true);
    expect(mockedAxios.post).toHaveBeenCalledWith(coinbaseProviderModule.BASE_EAS_SCAN_URL, {
      query: expect.any(String),
    });
  });

  it("should return false for an attestation that is revoked", async () => {
    const mockResponse = {
      data: {
        data: {
          attestations: [
            {
              recipient: testAddress,
              revocationTime: 0,
              revoked: true,
              expirationTime: Date.now() / 1000 + 10000,
            },
          ],
        },
      },
    };

    mockedAxios.post.mockResolvedValueOnce(mockResponse);

    const result = await coinbaseProviderModule.verifyCoinbaseAttestation(testAddress);
    expect(result).toBe(false);
  });

  it("should return false for an attestation that is expired", async () => {
    const mockResponse = {
      data: {
        data: {
          attestations: [
            {
              recipient: testAddress,
              revocationTime: 0,
              revoked: false,
              expirationTime: Date.now() / 1000 - 10000, // 10 seconds in the past
            },
          ],
        },
      },
    };

    mockedAxios.post.mockResolvedValueOnce(mockResponse);

    const result = await coinbaseProviderModule.verifyCoinbaseAttestation(testAddress);
    expect(result).toBe(false);
  });

  it("should handle an error from the API", async () => {
    mockedAxios.post.mockRejectedValue(new Error("Network error"));

    await expect(coinbaseProviderModule.verifyCoinbaseAttestation(testAddress)).rejects.toThrow("Network error");
  });
});

describe("Attempt verification", function () {
  it("should throw Provider External Verification error when unable to retrieve auth token", async () => {
    const mockAxiosError = new Error("Network error") as AxiosError;
    mockedAxios.isAxiosError.mockReturnValueOnce(true);
    mockAxiosError.response = {
      status: 500,
      data: {},
      headers: {},
      statusText: "Internal Server Error",
      config: {
        headers: {} as any
      },
    };

    mockedAxios.post.mockRejectedValueOnce(mockAxiosError);

    const coinbase = new coinbaseProviderModule.CoinbaseProvider();
    await expect(
      coinbase.verify({
        proofs: {
          code,
        },
      } as unknown as RequestPayload)
    ).rejects.toThrow(
      "Error making Coinbase access token request, received error response with code 500: {}, headers: {}"
    );
    expect(mockedAxios.post).toBeCalledTimes(1);
    expect(mockedAxios.post).toBeCalledWith(
      "https://login.coinbase.com/oauth2/token",
      `grant_type=authorization_code&client_id=${clientId}&client_secret=${clientSecret}&code=${code}&redirect_uri=${callback}`,
      { headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" } }
    );
  });

  it("should return invalid payload when there is no id in verify Coinbase response", async () => {
    mockedAxios.get.mockImplementation(async () => {
      return {
        data: {
          id: undefined,
          login: "my-login-handle",
          type: "User",
        },
        status: 200,
      };
    });

    const coinbase = new coinbaseProviderModule.CoinbaseProvider();
    expect(
      await coinbase.verify({
        proofs: {
          code,
        },
      } as unknown as RequestPayload)
    ).toMatchObject({
      valid: false,
      errors: ["Coinbase user id was not found."],
    });

    expect(mockedAxios.post).toBeCalledTimes(1);
    // Check the request to get the token
    expect(mockedAxios.post).toBeCalledWith(
      "https://login.coinbase.com/oauth2/token",
      `grant_type=authorization_code&client_id=${clientId}&client_secret=${clientSecret}&code=${code}&redirect_uri=${callback}`,
      { headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" } }
    );
    expect(mockedAxios.get).toBeCalledTimes(1);
    // Check the request to get the user
    expect(mockedAxios.get).toBeCalledWith("https://api.coinbase.com/v2/user", {
      headers: { Authorization: "Bearer cnbstkn294745627362562", Accept: "application/json" },
    });
  });

  it("should return invalid payload when a bad status code is returned by coinbase user api", async () => {
    const mockAxiosError = new Error("Network error") as AxiosError;
    mockedAxios.isAxiosError.mockReturnValueOnce(true);
    mockAxiosError.response = {
      status: 500,
      data: {},
      headers: {},
      statusText: "Internal Server Error",
      config: {
        headers: {} as any
      },
    };

    mockedAxios.get.mockRejectedValueOnce(mockAxiosError);

    const coinbase = new coinbaseProviderModule.CoinbaseProvider();
    await expect(
      coinbase.verify({
        proofs: {
          code,
        },
      } as unknown as RequestPayload)
    ).rejects.toThrow(
      "Error making Coinbase user info request, received error response with code 500: {}, headers: {}"
    );

    expect(mockedAxios.post).toBeCalledTimes(1);

    // Check the request to get the token
    expect(mockedAxios.post).toBeCalledWith(
      "https://login.coinbase.com/oauth2/token",
      `grant_type=authorization_code&client_id=${clientId}&client_secret=${clientSecret}&code=${code}&redirect_uri=${callback}`,
      { headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" } }
    );
    expect(mockedAxios.get).toBeCalledTimes(1);
    // Check the request to get the user
    expect(mockedAxios.get).toBeCalledWith("https://api.coinbase.com/v2/user", {
      headers: { Authorization: "Bearer cnbstkn294745627362562", Accept: "application/json" },
    });
  });

  it("should fail if unable to find ID", async () => {
    mockedAxios.get.mockImplementation(async (url, config) => {
      return {
        data: {
          id: undefined,
        },
      };
    });

    const coinbase = new coinbaseProviderModule.CoinbaseProvider();
    const coinbasePayload = await coinbase.verify({
      proofs: {
        code,
      },
    } as unknown as RequestPayload);

    expect(mockedAxios.post).toBeCalledTimes(1);

    // Check the request to get the token
    expect(mockedAxios.post).toBeCalledWith(
      "https://login.coinbase.com/oauth2/token",
      `grant_type=authorization_code&client_id=${clientId}&client_secret=${clientSecret}&code=${code}&redirect_uri=${callback}`,
      { headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" } }
    );
    expect(mockedAxios.get).toBeCalledTimes(1);
    // Check the request to get the user
    expect(mockedAxios.get).toBeCalledWith("https://api.coinbase.com/v2/user", {
      headers: { Authorization: "Bearer cnbstkn294745627362562", Accept: "application/json" },
    });

    expect(coinbasePayload).toMatchObject({
      valid: false,
      errors: ["Coinbase user id was not found."],
    });
  });

  it("handles valid verification attempt", async () => {
    jest.spyOn(coinbaseProviderModule, "verifyCoinbaseAttestation").mockResolvedValueOnce(true);
    mockedAxios.get.mockResolvedValue(validCoinbaseUserResponse);
    const coinbase = new coinbaseProviderModule.CoinbaseProvider();
    const coinbasePayload = await coinbase.verify({
      proofs: {
        code,
      },
    } as unknown as RequestPayload);

    expect(mockedAxios.post).toBeCalledTimes(1);
    // Check the request to get the token
    expect(mockedAxios.post).toBeCalledWith(
      "https://login.coinbase.com/oauth2/token",
      `grant_type=authorization_code&client_id=${clientId}&client_secret=${clientSecret}&code=${code}&redirect_uri=${callback}`,
      { headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" } }
    );

    expect(mockedAxios.get).toBeCalledTimes(1);
    // Check the request to get the user
    expect(mockedAxios.get).toBeCalledWith("https://api.coinbase.com/v2/user", {
      headers: { Authorization: "Bearer cnbstkn294745627362562", Accept: "application/json" },
    });

    expect(coinbasePayload).toEqual(
      expect.objectContaining({ valid: true, record: { id: validCoinbaseUserResponse.data.data.id } })
    );
  });
});
