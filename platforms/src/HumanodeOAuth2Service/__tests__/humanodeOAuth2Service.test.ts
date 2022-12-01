// TODO - remove eslint disable below once type rules are unified
/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/require-await */
// ---- Test subject
import { BiometricsLivenessCheckProvider } from "../Providers/BiometricsLivenessCheckProvider";

import { RequestPayload } from "@gitcoin/passport-types";

// ----- Libs
import axios from "axios";
import * as jose from "jose";

jest.mock("axios");
jest.mock("jose");

process.env.HUMANODE_OAUTH2_SERVICE_ACCESS_TOKEN_URL = "http://localhost/";

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedJose = jose as jest.Mocked<typeof jose>;

const code = "ABC123_ACCESSCODE";

const jwtPayload = {
  sub: "test-user-data",
};

const validCodeResponse = {
  data: {
    access_token: code,
  },
  status: 200,
};

beforeEach(() => {
  jest.clearAllMocks();

  mockedAxios.post.mockImplementation(async () => {
    return validCodeResponse;
  });

  mockedJose.createRemoteJWKSet.mockImplementation(() => null);

  mockedJose.jwtVerify.mockImplementation(async () => ({
    payload: {
      ...jwtPayload,
    },
    protectedHeader: {
      alg: "",
    },
    key: { type: "" },
  }));
});

describe("Attempt verification", function () {
  it("handles valid verification attempt", async () => {
    const humanodeOAuth2Service = new BiometricsLivenessCheckProvider();
    const humanodeOAuth2ServicePayload = await humanodeOAuth2Service.verify({
      proofs: {
        code,
      },
    } as unknown as RequestPayload);

    expect(humanodeOAuth2ServicePayload).toEqual({
      valid: true,
      record: {
        id: jwtPayload.sub,
      },
    });
  });

  it("should return invalid payload when unable to retrieve auth token", async () => {
    const logSpy = jest.spyOn(console, "error").mockImplementation();

    mockedAxios.post.mockImplementation(async () => {
      return {
        status: 500,
      };
    });

    const humanodeOAuth2Service = new BiometricsLivenessCheckProvider();

    const humanodeOAuth2ServicePayload = await humanodeOAuth2Service.verify({
      proofs: {
        code,
      },
    } as unknown as RequestPayload);

    expect(humanodeOAuth2ServicePayload).toMatchObject({ valid: false });
    expect(logSpy).toHaveBeenCalledWith("Error when verifying humanode oauth2 service account for user:", undefined);
  });

  it("should return invalid payload when there is no id in verifyHumanodeOAuth2Service response", async () => {
    mockedJose.jwtVerify.mockImplementation(async () => {
      throw "invalid token";
    });

    const humanodeOAuth2Service = new BiometricsLivenessCheckProvider();

    const humanodeOAuth2ServicePayload = await humanodeOAuth2Service.verify({
      proofs: {
        code,
      },
    } as unknown as RequestPayload);

    expect(humanodeOAuth2ServicePayload).toMatchObject({ valid: false });
  });
});
