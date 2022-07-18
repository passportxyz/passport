// ---- Test subject
import { CoinbaseProvider } from "../src/providers/coinbase";

import { RequestPayload } from "@gitcoin/passport-types";

// ----- Libs
import axios from "axios";

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

const code = "ABC123_ACCESSCODE";

beforeEach(() => {
  jest.clearAllMocks();
  mockedAxios.post.mockImplementation(async (url, data, config) => {
    return validCodeResponse;
  });

  mockedAxios.get.mockImplementation(async (url, config) => {
    return validCoinbaseUserResponse;
  });
});

describe("Attempt verification", function () {
  it("handles valid verification attempt", async () => {
    const clientId = process.env.COINBASE_CLIENT_ID;
    const clientSecret = process.env.COINBASE_CLIENT_SECRET;
    const callback = process.env.COINBASE_CALLBACK;
    const coinbase = new CoinbaseProvider();
    const coinbasePayload = await coinbase.verify({
      proofs: {
        code,
      },
    } as unknown as RequestPayload);

    // Check the request to get the token
    expect(mockedAxios.post).toBeCalledWith(
      `https://api.coinbase.com/oauth/token?grant_type=authorization_code&client_id=${clientId}&client_secret=${clientSecret}&code=${code}&redirect_uri=${callback}`,
      {},
      {
        headers: { Accept: "application/json" },
      }
    );

    // Check the request to get the user
    expect(mockedAxios.get).toBeCalledWith("https://api.coinbase.com/v2/user", {
      headers: { Authorization: "Bearer cnbstkn294745627362562" },
    });

    expect(coinbasePayload).toEqual({
      valid: true,
      record: {
        id: validCoinbaseUserResponse.data.data.id,
      },
    });
  });

  it("should return invalid payload when unable to retrieve auth token", async () => {
    mockedAxios.post.mockImplementation(async (url, data, config) => {
      return {
        status: 500,
      };
    });

    const github = new CoinbaseProvider();

    const githubPayload = await github.verify({
      proofs: {
        code,
      },
    } as unknown as RequestPayload);

    expect(githubPayload).toMatchObject({ valid: false });
  });

  it("should return invalid payload when there is no id in verifyGithub response", async () => {
    mockedAxios.get.mockImplementation(async (url, config) => {
      return {
        data: {
          id: undefined,
          login: "my-login-handle",
          type: "User",
        },
        status: 200,
      };
    });

    const coinbase = new CoinbaseProvider();

    const coinbasePayload = await coinbase.verify({
      proofs: {
        code,
      },
    } as unknown as RequestPayload);

    expect(coinbasePayload).toMatchObject({ valid: false });
  });

  it("should return invalid payload when a bad status code is returned by coinbase user api", async () => {
    mockedAxios.get.mockImplementation(async (url, config) => {
      return {
        status: 500,
      };
    });

    const coinbase = new CoinbaseProvider();

    const coinbasePayload = await coinbase.verify({
      proofs: {
        code,
      },
    } as unknown as RequestPayload);

    expect(coinbasePayload).toMatchObject({ valid: false });
  });
});
