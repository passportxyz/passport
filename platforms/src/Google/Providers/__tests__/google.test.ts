// ---- Test subject
import { RequestPayload } from "@gitcoin/passport-types";
import * as google from "../google.js";

const MOCK_EMAIL = "testEmail";
const MOCK_EMAIL_VERIFIED = true;
const MOCK_TOKEN_ID = "testToken";
const MOCK_ACCESS_TOKEN = "secret access token";

import axios from "axios";

jest.mock("axios");

describe("Attempt verification", function () {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("handles valid verification attempt", async () => {
    const googleProvider = new google.GoogleProvider();

    const accessTokenMock = (axios.post as jest.Mock).mockImplementation(
      (): Promise<{ data: google.GoogleTokenResponse }> => {
        return new Promise((resolve) => {
          resolve({ data: { access_token: MOCK_ACCESS_TOKEN } });
        });
      }
    );

    const userInfoMock = jest.spyOn(axios, "get").mockImplementation((): Promise<unknown> => {
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

    const verifiedPayload = await googleProvider.verify({
      address: "0x0",
      proofs: {
        code: MOCK_TOKEN_ID,
      },
    } as unknown as RequestPayload);

    expect(accessTokenMock).toHaveBeenCalledWith(
      `https://oauth2.googleapis.com/token?client_id=undefined&client_secret=undefined&code=${MOCK_TOKEN_ID}&grant_type=authorization_code&redirectUri=undefined`,
      {},
      {
        headers: { Accept: "application/json" },
      }
    );
    expect(userInfoMock).toHaveBeenCalledWith("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${MOCK_ACCESS_TOKEN}` },
    });
    expect(verifiedPayload).toEqual({
      valid: true,
      record: {
        email: MOCK_EMAIL,
      },
      errors: [],
    });
  });

  it("should return invalid payload when email is not verified", async () => {
    const googleProvider = new google.GoogleProvider();

    const accessTokenMock = (axios.post as jest.Mock).mockImplementation(
      (): Promise<{ data: google.GoogleTokenResponse }> => {
        return new Promise((resolve) => {
          resolve({ data: { access_token: MOCK_ACCESS_TOKEN } });
        });
      }
    );

    const userInfoMock = jest.spyOn(axios, "get").mockImplementation((): Promise<unknown> => {
      return new Promise((resolve) => {
        resolve({
          data: {
            email: MOCK_EMAIL,
            verified_email: false,
          },
          status: 200,
        });
      });
    });

    const verifiedPayload = await googleProvider.verify({
      address: "0x0",
      proofs: {
        code: MOCK_TOKEN_ID,
      },
    } as unknown as RequestPayload);

    expect(accessTokenMock).toHaveBeenCalledWith(
      `https://oauth2.googleapis.com/token?client_id=undefined&client_secret=undefined&code=${MOCK_TOKEN_ID}&grant_type=authorization_code&redirectUri=undefined`,
      {},
      {
        headers: { Accept: "application/json" },
      }
    );
    expect(userInfoMock).toHaveBeenCalledWith("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${MOCK_ACCESS_TOKEN}` },
    });
    expect(verifiedPayload).toEqual({
      valid: false,
      record: undefined,
      errors: ["We couldn't verify the Google email you attempted to authorize with."],
    });
  });
});

describe("verifyGoogle", function () {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("should suceed when a access token and user info are obtained", async () => {
    const accessTokenMock = (axios.post as jest.Mock).mockImplementation(
      (): Promise<{ data: google.GoogleTokenResponse }> => {
        return new Promise((resolve) => {
          resolve({ data: { access_token: MOCK_ACCESS_TOKEN } });
        });
      }
    );

    const userInfoMock = jest.spyOn(axios, "get").mockImplementation((): Promise<unknown> => {
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
    expect(accessTokenMock).toHaveBeenCalledWith(
      `https://oauth2.googleapis.com/token?client_id=undefined&client_secret=undefined&code=${MOCK_TOKEN_ID}&grant_type=authorization_code&redirectUri=undefined`,
      {},
      {
        headers: { Accept: "application/json" },
      }
    );
    expect(userInfoMock).toHaveBeenCalledWith("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${MOCK_ACCESS_TOKEN}` },
    });
    expect(verifiedGoogleResponse).toEqual({
      email: MOCK_EMAIL,
      emailVerified: MOCK_EMAIL_VERIFIED,
    });
  });

  it("should throw if getting user info throws", async () => {
    const accessTokenMock = (axios.post as jest.Mock).mockImplementation(
      (): Promise<{ data: google.GoogleTokenResponse }> => {
        return new Promise((resolve) => {
          resolve({ data: { access_token: MOCK_ACCESS_TOKEN } });
        });
      }
    );

    const userInfoMock = (axios.get as jest.Mock).mockImplementation((): Promise<google.GoogleUserInfo> => {
      throw { response: { data: { error: { message: "error message for user data request" } } } };
    });

    const verifiedGoogleResponse = await google.verifyGoogle(MOCK_TOKEN_ID);

    expect(verifiedGoogleResponse).toEqual({
      errors: [
        "Error getting user info",
        "undefined",
        "Status undefined: undefined",
        "Details: " + JSON.stringify({ error: { message: "error message for user data request" } }),
      ],
    });
    expect(accessTokenMock).toHaveBeenCalledWith(
      `https://oauth2.googleapis.com/token?client_id=undefined&client_secret=undefined&code=${MOCK_TOKEN_ID}&grant_type=authorization_code&redirectUri=undefined`,
      {},
      {
        headers: { Accept: "application/json" },
      }
    );
    expect(userInfoMock).toHaveBeenCalledTimes(1);
    expect(userInfoMock).toHaveBeenCalledWith("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${MOCK_ACCESS_TOKEN}` },
    });
  });

  it("should throw when requestAccessToken throws", async () => {
    const accessTokenMock = (axios.post as jest.Mock).mockImplementation(
      (): Promise<{ data: google.GoogleTokenResponse }> => {
        throw new Error("Some Error");
      }
    );

    const verifiedGoogleResponse = await google.verifyGoogle(MOCK_TOKEN_ID);

    expect(verifiedGoogleResponse).toEqual({
      errors: [
        "Error getting user info",
        "Error - Some Error|response: Status undefined - undefined|response data: undefined",
        "Status undefined: undefined",
        "Details: undefined",
      ],
    });
  });
});
