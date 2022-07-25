// ---- Test subject
import { RequestPayload } from "@gitcoin/passport-types";
import { GoogleProvider } from "../src/providers/google";

jest.mock("google-auth-library");

import { OAuth2Client } from "google-auth-library";

const MOCK_EMAIL = "testEmail";
const MOCK_EMAIL_VERIFIED = true;
const MOCK_TOKEN_ID = "testToken";

const OAuth2ClientMock = jest.spyOn(OAuth2Client.prototype, "verifyIdToken").mockImplementation(() => {
  return {
    getPayload: jest.fn(() => ({
      email: MOCK_EMAIL,
      email_verified: MOCK_EMAIL_VERIFIED,
    })),
  };
});

describe("Attempt verification", function () {
  it("handles valid verification attempt", async () => {
    const google = new GoogleProvider();

    const verifiedPayload = await google.verify({
      proofs: {
        tokenId: MOCK_TOKEN_ID,
      },
    } as unknown as RequestPayload);

    expect(OAuth2ClientMock).toBeCalledWith({ idToken: MOCK_TOKEN_ID, audience: process.env.GOOGLE_CLIENT_ID });
    expect(verifiedPayload).toEqual({
      valid: true,
      record: {
        email: MOCK_EMAIL,
      },
    });
  });

  it("should return invalid payload when email is not verified", async () => {
    jest.spyOn(OAuth2Client.prototype, "verifyIdToken").mockImplementation(() => {
      return {
        getPayload: jest.fn(() => ({
          email: MOCK_EMAIL,
          email_verified: false,
        })),
      };
    });

    const google = new GoogleProvider();

    const verifiedPayload = await google.verify({
      proofs: {
        tokenId: MOCK_TOKEN_ID,
      },
    } as unknown as RequestPayload);

    expect(verifiedPayload).toEqual({
      valid: false,
      record: {
        email: MOCK_EMAIL,
      },
    });
  });

  it("should return invalid payload when verifyIdToken throws exception", async () => {
    jest.spyOn(OAuth2Client.prototype, "verifyIdToken").mockImplementation(() => {
      throw Error("bad >:(");
    });

    const google = new GoogleProvider();

    const verifiedPayload = await google.verify({
      proofs: {
        tokenId: MOCK_TOKEN_ID,
      },
    } as unknown as RequestPayload);

    expect(verifiedPayload).toEqual({
      valid: false,
    });
  });
});
