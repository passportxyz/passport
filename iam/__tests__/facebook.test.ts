// ---- Test subject
import { FacebookDebugResponse, FacebookProvider } from "../src/providers/facebook";
import { RequestPayload } from "@gitcoin/passport-types";
import axios from "axios";
import { DateTime } from "luxon";

jest.mock("axios");

describe("Attempt verification", function () {
  const accessToken = "12345";
  const appAccessToken = `${process.env.FACEBOOK_APP_ID}|${process.env.FACEBOOK_APP_SECRET}`;
  const tokenExpirationDate = DateTime.now().plus({ years: 1 }).toSeconds();
  let validAccessTokenData: FacebookDebugResponse = {
    app_id: process.env.FACEBOOK_APP_ID,
    type: "USER",
    application: "dpopp",
    data_access_expires_at: tokenExpirationDate,
    expires_at: tokenExpirationDate,
    is_valid: true,
    scopes: ["public_profile"],
    user_id: "some-user-id",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("handles valid verification attempt", async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce({
      data: {
        data: {
          ...validAccessTokenData,
        },
      },
    });

    const result = await new FacebookProvider().verify({
      proofs: {
        accessToken,
      },
    } as unknown as RequestPayload);

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(axios.get).toBeCalledWith("https://graph.facebook.com/debug_token/", {
      headers: { "User-Agent": "Facebook Graph Client" },
      params: { access_token: appAccessToken, input_token: accessToken },
    });
    expect(result).toEqual({
      valid: true,
      record: {
        user_id: "some-user-id",
      },
    });
  });

  it("returns invalid response when access token is not valid", async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce({
      data: {
        data: {
          ...validAccessTokenData,
          is_valid: false,
        },
      },
    });

    const result = await new FacebookProvider().verify({
      proofs: {
        accessToken,
      },
    } as unknown as RequestPayload);

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      valid: false,
    });
  });

  it("returns invalid response when user_id is not present", async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce({
      data: {
        data: {
          ...validAccessTokenData,
          user_id: undefined,
        },
      },
    });

    const result = await new FacebookProvider().verify({
      proofs: {
        accessToken,
      },
    } as unknown as RequestPayload);

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      valid: false,
    });
  });

  it("returns invalid response when app_id doesn't match dpopp app id", async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce({
      data: {
        data: {
          ...validAccessTokenData,
          app_id: "fake-app-id",
        },
      },
    });

    const result = await new FacebookProvider().verify({
      proofs: {
        accessToken,
      },
    } as unknown as RequestPayload);

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      valid: false,
    });
  });

  it("returns invalid response when access token is expired", async () => {
    const expiredDate = DateTime.now().minus({ years: 1 }).toSeconds();
    (axios.get as jest.Mock).mockResolvedValueOnce({
      data: {
        data: {
          ...validAccessTokenData,
          expires_at: expiredDate,
        },
      },
    });

    const result = await new FacebookProvider().verify({
      proofs: {
        accessToken,
      },
    } as unknown as RequestPayload);

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      valid: false,
    });
  });

  it("returns invalid response when call results in error", async () => {
    (axios.get as jest.Mock).mockRejectedValueOnce({ status: 400, data: { error: { message: "some error" } } });

    const result = await new FacebookProvider().verify({
      proofs: {
        accessToken,
      },
    } as unknown as RequestPayload);

    expect(result).toMatchObject({
      valid: false,
    });
  });
});
