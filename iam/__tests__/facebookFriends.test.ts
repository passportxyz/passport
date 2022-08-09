// ---- Test subject
import { FacebookDebugResponse } from "../src/providers/facebook";
import { RequestPayload } from "@gitcoin/passport-types";
import axios from "axios";
import { DateTime } from "luxon";
import { FacebookFriendsProvider, FacebookFriendsResponse } from "../src/providers/facebookFriends";

jest.mock("axios");

describe("Attempt Facebook friends verification", function () {
  const accessToken = "12345";
  const appAccessToken = `${process.env.FACEBOOK_APP_ID}|${process.env.FACEBOOK_APP_SECRET}`;
  const tokenExpirationDate = DateTime.now().plus({ years: 1 }).toSeconds();
  let validAccessTokenData: FacebookDebugResponse = {
    app_id: process.env.FACEBOOK_APP_ID,
    type: "USER",
    application: "Gitcoin Passport",
    data_access_expires_at: tokenExpirationDate,
    expires_at: tokenExpirationDate,
    is_valid: true,
    scopes: ["public_profile"],
    user_id: "some-user-id",
  };
  let validFriendList: FacebookFriendsResponse = {
    data: [],
    paging: { before: "before", after: "after" },
    summary: { total_count: 123 },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("handles valid verification attempt", async () => {
    (axios.get as jest.Mock).mockImplementation((url) => {
      if (url === "https://graph.facebook.com/debug_token/")
        return Promise.resolve({
          data: {
            data: {
              ...validAccessTokenData,
            },
          },
        });
      else if (url === "https://graph.facebook.com/me/friends/")
        return Promise.resolve({
          data: {
            ...validFriendList,
          },
        });
    });

    const result = await new FacebookFriendsProvider().verify({
      proofs: {
        accessToken,
      },
    } as unknown as RequestPayload);

    expect(axios.get).toHaveBeenCalledTimes(2);
    expect(axios.get).toBeCalledWith("https://graph.facebook.com/debug_token/", {
      headers: { "User-Agent": "Facebook Graph Client" },
      params: { access_token: appAccessToken, input_token: accessToken },
    });
    expect(axios.get).toBeCalledWith("https://graph.facebook.com/me/friends/", {
      headers: { "User-Agent": "Facebook Graph Client" },
      params: { access_token: accessToken },
    });
    expect(result).toEqual({
      valid: true,
      record: {
        user_id: "some-user-id",
        facebookFriendsGTE100: "true",
      },
    });
  });

  it("returns invalid response when access token is not valid", async () => {
    (axios.get as jest.Mock).mockImplementation((url) => {
      if (url === "https://graph.facebook.com/debug_token/")
        return Promise.resolve({
          data: {
            data: {
              ...validAccessTokenData,
              is_valid: false,
            },
          },
        });
      else if (url === "https://graph.facebook.com/me/friends/")
        return Promise.resolve({
          data: {
            ...validFriendList,
          },
        });
    });

    const result = await new FacebookFriendsProvider().verify({
      proofs: {
        accessToken,
      },
    } as unknown as RequestPayload);

    expect(axios.get).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({
      valid: false,
    });
  });

  it("returns invalid response when user_id is not present in /debug_token response", async () => {
    (axios.get as jest.Mock).mockImplementation((url) => {
      if (url === "https://graph.facebook.com/debug_token/")
        return Promise.resolve({
          data: {
            data: {
              ...validAccessTokenData,
              user_id: undefined,
            },
          },
        });
      else if (url === "https://graph.facebook.com/me/friends/")
        return Promise.resolve({
          data: {
            ...validFriendList,
          },
        });
    });

    const result = await new FacebookFriendsProvider().verify({
      proofs: {
        accessToken,
      },
    } as unknown as RequestPayload);

    expect(axios.get).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({
      valid: false,
    });
  });

  it("returns invalid response when app_id in /debug_token response doesn't match passport app id", async () => {
    (axios.get as jest.Mock).mockImplementation((url) => {
      if (url === "https://graph.facebook.com/debug_token/")
        return Promise.resolve({
          data: {
            data: {
              ...validAccessTokenData,
              app_id: "fake-app-id",
            },
          },
        });
      else if (url === "https://graph.facebook.com/me/friends/")
        return Promise.resolve({
          data: {
            ...validFriendList,
          },
        });
    });

    const result = await new FacebookFriendsProvider().verify({
      proofs: {
        accessToken,
      },
    } as unknown as RequestPayload);

    expect(axios.get).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({
      valid: false,
    });
  });

  it("returns invalid response when access token is expired", async () => {
    const expiredDate = DateTime.now().minus({ years: 1 }).toSeconds();
    (axios.get as jest.Mock).mockImplementation((url) => {
      if (url === "https://graph.facebook.com/debug_token/")
        return Promise.resolve({
          data: {
            data: {
              ...validAccessTokenData,
              expires_at: expiredDate,
            },
          },
        });
      else if (url === "https://graph.facebook.com/me/friends/")
        return Promise.resolve({
          data: {
            ...validFriendList,
          },
        });
    });

    const result = await new FacebookFriendsProvider().verify({
      proofs: {
        accessToken,
      },
    } as unknown as RequestPayload);

    expect(axios.get).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({
      valid: false,
    });
  });

  it("returns invalid response when /debug_token call results in error", async () => {
    (axios.get as jest.Mock).mockImplementation((url) => {
      if (url === "https://graph.facebook.com/debug_token/")
        return Promise.resolve({ status: 400, data: { error: { message: "some error" } } });
      else if (url === "https://graph.facebook.com/me/friends/")
        return Promise.resolve({
          data: {
            ...validFriendList,
          },
        });
    });

    const result = await new FacebookFriendsProvider().verify({
      proofs: {
        accessToken,
      },
    } as unknown as RequestPayload);

    expect(result).toMatchObject({
      valid: false,
    });
  });

  it("returns invalid response when /friends call results in error", async () => {
    (axios.get as jest.Mock).mockImplementation((url) => {
      if (url === "https://graph.facebook.com/debug_token/")
        return Promise.resolve({
          data: {
            data: {
              ...validAccessTokenData,
            },
          },
        });
      else if (url === "https://graph.facebook.com/me/friends/")
        return Promise.resolve({ status: 400, data: { error: { message: "some error" } } });
    });

    const result = await new FacebookFriendsProvider().verify({
      proofs: {
        accessToken,
      },
    } as unknown as RequestPayload);

    expect(result).toMatchObject({
      valid: false,
    });
  });

  it("returns invalid response when friend list is not >= 100", async () => {
    (axios.get as jest.Mock).mockImplementation((url) => {
      if (url === "https://graph.facebook.com/debug_token/")
        return Promise.resolve({
          data: {
            data: {
              ...validAccessTokenData,
            },
          },
        });
      else if (url === "https://graph.facebook.com/me/friends/")
        return Promise.resolve({
          data: {
            ...validFriendList,
            summary: { total_count: 99 },
          },
        });
    });

    const result = await new FacebookFriendsProvider().verify({
      proofs: {
        accessToken,
      },
    } as unknown as RequestPayload);

    expect(axios.get).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({
      valid: false,
    });
  });

  it("returns invalid response when total_count in friend list summary is undefined", async () => {
    (axios.get as jest.Mock).mockImplementation((url) => {
      if (url === "https://graph.facebook.com/debug_token/")
        return Promise.resolve({
          data: {
            data: {
              ...validAccessTokenData,
            },
          },
        });
      else if (url === "https://graph.facebook.com/me/friends/")
        return Promise.resolve({
          data: {
            ...validFriendList,
            summary: undefined,
          },
        });
    });

    const result = await new FacebookFriendsProvider().verify({
      proofs: {
        accessToken,
      },
    } as unknown as RequestPayload);

    expect(axios.get).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({
      valid: false,
    });
  });
});
