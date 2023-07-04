/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/require-await */
// ---- Test subject
import { AspectaProvider } from "../Providers/aspecta";

import { RequestPayload } from "@gitcoin/passport-types";

// ----- Libs
import axios from "axios";

jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;

const validAspectaUserResponse = {
  data: {
    "username": "ying",
    "profile_url": "https://dev.aspecta.id/",
    "nickname": "ying",
    "avatar": "https://media/avatar/5af87dea80f7860bdefc32d654110ad8.jpg",
    "introduction": "profileying162ying162ying162ying162ying162ying162ying162ying162ying162ying162ying162ying1"
  },
  status: 200,
};

const validCodeResponse = {
  data: {
    access_token: "HMGGPY1KRGmQAVrPjfwrwnuhATTMFCnNrmzZ5PSczt",
  },
  status: 200,
};

const code = "l4WUNccRrlNWT23nBV3RpxwODbma30ZuSU8s86KD8EE7Xzuq";

beforeEach(() => {
  jest.clearAllMocks();
  mockedAxios.post.mockImplementation(async (url, data, config) => {
    return validCodeResponse;
  });

  mockedAxios.get.mockImplementation(async (url, config) => {
    return validAspectaUserResponse;
  });
});

describe("Attempt verification", function () {
  it("handles valid verification attempt", async () => {
    const aspecta = new AspectaProvider();
    const aspectaPayload = await aspecta.verify({
      proofs: {
        code,
      },
    } as unknown as RequestPayload);

    // Check the request to get the user
    expect(mockedAxios.get).toBeCalledWith("https://api.dev.aspecta.id/v1/users/me", {
      headers: { Authorization: "Bearer HMGGPY1KRGmQAVrPjfwrwnuhATTMFCnNrmzZ5PSczt" },
    });

    expect(aspectaPayload).toEqual({
      valid: true,
      record: {
        username: validAspectaUserResponse.data.username,
      },
    });
  });

  it("should return invalid payload when unable to retrieve auth token", async () => {
    const logSpy = jest.spyOn(console, "error").mockImplementation();

    mockedAxios.post.mockImplementation(async (url, data, config) => {
      return {
        status: 500,
      };
    });

    const aspecta = new AspectaProvider();

    const aspectaPayload = await aspecta.verify({
      proofs: {
        code,
      },
    } as unknown as RequestPayload);

    expect(aspectaPayload).toMatchObject({ valid: false });
    expect(logSpy).toHaveBeenCalledWith("Error when verifying aspecta account for user:", undefined);
  });

  it("should return invalid payload when there is no id in verifyAspecta response", async () => {
    mockedAxios.get.mockImplementation(async (url, config) => {
      return {
        data: {
          "username": undefined,
          "profile_url": "",
          "nickname": "",
          "avatar": "",
          "introduction": ""
        },
        status: 200,
      };
    });

    const aspecta = new AspectaProvider();

    const aspectaPayload = await aspecta.verify({
      proofs: {
        code,
      },
    } as unknown as RequestPayload);

    expect(aspectaPayload).toMatchObject({ valid: false });
  });

  it("should return invalid payload when a bad status code is returned by aspecta user api", async () => {
    mockedAxios.get.mockImplementation(async (url, config) => {
      return {
        status: 500,
      };
    });

    const aspecta = new AspectaProvider();

    const aspectaPayload = await aspecta.verify({
      proofs: {
        code,
      },
    } as unknown as RequestPayload);

    expect(aspectaPayload).toMatchObject({ valid: false });
  });
});
