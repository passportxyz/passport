// ---- Test subject
import { RequestPayload } from "@gitcoin/passport-types";
import * as google from "../google";

const MOCK_EMAIL = "testEmail";
const MOCK_EMAIL_VERIFIED = true;
const MOCK_TOKEN_ID = "testToken";
const MOCK_ACCESS_TOKEN = "secret access token";

import axios from "axios";

describe("Attempt verification", function () {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("handles valid verification attempt", async () => {
    const googleProvider = new google.GoogleProvider();

    const verifyGoogleMock = jest
      .spyOn(google, "verifyGoogle")
      .mockImplementation((code: string): Promise<google.UserInfo> => {
        return new Promise<google.UserInfo>((resolve) => {
          resolve({
            email: MOCK_EMAIL,
            emailVerified: MOCK_EMAIL_VERIFIED,
          });
        });
      });

    const verifiedPayload = await googleProvider.verify({
      proofs: {
        code: MOCK_TOKEN_ID,
      },
    } as unknown as RequestPayload);

    expect(verifyGoogleMock).toBeCalledWith(MOCK_TOKEN_ID);
    expect(verifiedPayload).toEqual({
      valid: true,
      record: {
        email: MOCK_EMAIL,
      },
    });
  });

  it("should return invalid payload when email is not verified", async () => {
    const googleProvider = new google.GoogleProvider();
    const verifyGoogleMock = jest
      .spyOn(google, "verifyGoogle")
      .mockImplementation((code: string): Promise<google.UserInfo> => {
        return new Promise<google.UserInfo>((resolve) => {
          resolve({
            email: MOCK_EMAIL,
            emailVerified: false,
          });
        });
      });

    const verifiedPayload = await googleProvider.verify({
      proofs: {
        code: MOCK_TOKEN_ID,
      },
    } as unknown as RequestPayload);

    expect(verifyGoogleMock).toBeCalledWith(MOCK_TOKEN_ID);
    expect(verifiedPayload).toEqual({
      valid: false,
      record: {
        email: MOCK_EMAIL,
      },
    });
  });
});

describe("verifyGoogle", function () {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("should suceed when a access token and user info are obtained", async () => {
    const requestAccessTokenMock = jest
      .spyOn(google, "requestAccessToken")
      .mockImplementation((code: string): Promise<string> => {
        return new Promise((resolve) => {
          resolve(MOCK_ACCESS_TOKEN);
        });
      });

    const userInfoMock = jest.spyOn(axios, "get").mockImplementation((code: string): Promise<unknown> => {
      return new Promise((resolve) => {
        resolve({
          data: {
            email: MOCK_EMAIL,
            verified_email: MOCK_EMAIL_VERIFIED,
          },
          status: 200,
        });
      });
    });

    const verifiedGoogleResponse = await google.verifyGoogle(MOCK_TOKEN_ID);
    expect(requestAccessTokenMock).toBeCalledWith(MOCK_TOKEN_ID);
    expect(userInfoMock).toBeCalledWith("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${MOCK_ACCESS_TOKEN}` },
    });
    expect(verifiedGoogleResponse).toEqual({
      email: MOCK_EMAIL,
      emailVerified: MOCK_EMAIL_VERIFIED,
    });
  });

  it("should throw if getting user info throws", async () => {
    const requestAccessTokenMock = jest
      .spyOn(google, "requestAccessToken")
      .mockImplementation((code: string): Promise<string> => {
        return new Promise((resolve) => {
          resolve(MOCK_ACCESS_TOKEN);
        });
      });

    const userInfoMock = jest.spyOn(axios, "get").mockImplementation((code: string): Promise<google.GoogleUserInfo> => {
      throw { response: { data: { error: { message: "error message for user data request" } } } };
    });

    const verifiedGoogleResponse = await google.verifyGoogle(MOCK_TOKEN_ID);

    expect(verifiedGoogleResponse).toEqual({
      errors: [
        "Error getting user info",
        "undefined",
        "Status undefined: undefined",
        'Details: {"error":{"message":"error message for user data request"}}',
      ],
    });
    expect(requestAccessTokenMock).toBeCalledWith(MOCK_TOKEN_ID);
    expect(userInfoMock).toBeCalledTimes(1);
    expect(userInfoMock).toBeCalledWith("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${MOCK_ACCESS_TOKEN}` },
    });
  });

  it("should throw when requestAccessToken throws", async () => {
    jest.spyOn(google, "requestAccessToken").mockImplementation((code: string): Promise<string> => {
      throw new Error("ERROR");
    });

    const verifiedGoogleResponse = await google.verifyGoogle(MOCK_TOKEN_ID);

    expect(verifiedGoogleResponse).toEqual({
      errors: ["Error getting user info", "ERROR", "Status undefined: undefined", "Details: undefined"],
    });
  });
});
