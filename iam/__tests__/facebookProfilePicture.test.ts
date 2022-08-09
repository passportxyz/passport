// ---- Test subject
import { FacebookDebugResponse } from "../src/providers/facebook";
import { RequestPayload } from "@gitcoin/passport-types";
import axios from "axios";
import { DateTime } from "luxon";
import { FacebookProfilePictureProvider, FacebookProfileResponse } from "../src/providers/facebookProfilePicture";

jest.mock("axios");

describe("Attempt Facebook friends verification", function () {
  const accessToken = "12345";
  let validProfileData: FacebookProfileResponse = {
    id: "some-user-id",
    picture: {
      data: {
        is_silhouette: false,
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("handles valid verification attempt", async () => {
    (axios.get as jest.Mock).mockImplementation((url) => {
      if (url === "https://graph.facebook.com/me/")
        return Promise.resolve({
          status: 200,
          data: {
            ...validProfileData,
          },
        });
    });

    const result = await new FacebookProfilePictureProvider().verify({
      proofs: {
        accessToken,
      },
    } as unknown as RequestPayload);

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(axios.get).toBeCalledWith("https://graph.facebook.com/me/", {
      headers: { "User-Agent": "Facebook Graph Client" },
      params: { access_token: accessToken, fields: "id,picture{is_silhouette}" },
    });
    expect(result).toEqual({
      valid: true,
      record: {
        userId: "some-user-id",
        hasProfilePicture: "true",
      },
    });
  });

  it("returns invalid response when status != 200 is returned", async () => {
    (axios.get as jest.Mock).mockImplementation((url) => {
      if (url === "https://graph.facebook.com/me/")
        return Promise.resolve({
          status: 400,
          data: {
            ...validProfileData,
          },
        });
    });

    const result = await new FacebookProfilePictureProvider().verify({
      proofs: {
        accessToken,
      },
    } as unknown as RequestPayload);

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      valid: false,
    });
  });

  it("returns invalid response when access token is not valid", async () => {
    (axios.get as jest.Mock).mockImplementation((url) => {
      if (url === "https://graph.facebook.com/me/")
        return Promise.resolve({
          status: 400,
          data: {
            error: {
              message: "Error validating access token: The session is invalid because the user logged out.",
              type: "OAuthException",
              code: 190,
              error_subcode: 467,
              fbtrace_id: "xsdqfuiwqefguisbdjk",
            },
          },
        });
    });

    const result = await new FacebookProfilePictureProvider().verify({
      proofs: {
        accessToken,
      },
    } as unknown as RequestPayload);

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      valid: false,
    });
  });

  it("returns invalid response when an error occurs when getting user profile", async () => {
    (axios.get as jest.Mock).mockImplementation((url) => {
      throw "some kind of error";
    });

    const result = await new FacebookProfilePictureProvider().verify({
      proofs: {
        accessToken,
      },
    } as unknown as RequestPayload);

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      valid: false,
    });
  });

  it("returns invalid response when is_silhouette is true", async () => {
    (axios.get as jest.Mock).mockImplementation((url) => {
      if (url === "https://graph.facebook.com/me/")
        return Promise.resolve({
          status: 200,
          data: {
            ...validProfileData,
            picture: {
              data: {
                is_silhouette: true,
              },
            },
          },
        });
    });

    const result = await new FacebookProfilePictureProvider().verify({
      proofs: {
        accessToken,
      },
    } as unknown as RequestPayload);

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      valid: false,
    });
  });

  it("returns invalid response when picture is not available", async () => {
    (axios.get as jest.Mock).mockImplementation((url) => {
      if (url === "https://graph.facebook.com/me/")
        return Promise.resolve({
          status: 200,
          data: {
            ...validProfileData,
            picture: undefined,
          },
        });
    });

    const result = await new FacebookProfilePictureProvider().verify({
      proofs: {
        accessToken,
      },
    } as unknown as RequestPayload);

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      valid: false,
    });
  });
});
