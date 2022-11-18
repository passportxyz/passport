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
      .mockImplementation((code: string): Promise<google.GoogleResponse> => {
        return new Promise<google.GoogleResponse>((resolve) => {
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
      .mockImplementation((code: string): Promise<google.GoogleResponse> => {
        return new Promise<google.GoogleResponse>((resolve) => {
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

  it("should return invalid payload when verifyGoogle throws exception", async () => {
    const googleProvider = new google.GoogleProvider();
    const verifyGoogleMock = jest
      .spyOn(google, "verifyGoogle")
      .mockImplementation((code: string): Promise<google.GoogleResponse> => {
        throw Error("ERROR!!!");
      });

    const verifiedPayload = await googleProvider.verify({
      proofs: {
        code: MOCK_TOKEN_ID,
      },
    } as unknown as RequestPayload);

    expect(verifyGoogleMock).toBeCalledWith(MOCK_TOKEN_ID);
    expect(verifiedPayload).toEqual({
      valid: false,
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

    const userInfoMock = jest.spyOn(axios, "get").mockImplementation((code: string): Promise<{}> => {
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

    const userInfoMock = jest.spyOn(axios, "get").mockImplementation((code: string): Promise<{}> => {
      throw Error("USER INFO ERROR");
    });

    try {
      const verifiedGoogleResponse = await google.verifyGoogle(MOCK_TOKEN_ID);
    } catch (e) {
      expect(e).toEqual(Error("USER INFO ERROR"));
    }
    expect(requestAccessTokenMock).toBeCalledWith(MOCK_TOKEN_ID);
    expect(userInfoMock).toBeCalledWith("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${MOCK_ACCESS_TOKEN}` },
    });
  });

  it("should throw when requestAccessToken throws", async () => {
    const requestAccessTokenMock = jest
      .spyOn(google, "requestAccessToken")
      .mockImplementation((code: string): Promise<string> => {
        throw Error("ERROR");
      });

    try {
      const verifiedGoogleResponse = await google.verifyGoogle(MOCK_TOKEN_ID);
      fail("Should have thrown ...");
    } catch (e) {
      expect(e).toEqual(Error("ERROR"));
    }
  });
});
