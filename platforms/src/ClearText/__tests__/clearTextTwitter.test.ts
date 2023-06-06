// TODO - Remove once ts lint has been unified across packages
/* eslint-disable @typescript-eslint/require-await */
// ---- Test subject
import { ClearTextTwitterProvider } from "../Providers/clearTextTwitter";

import { RequestPayload } from "@gitcoin/passport-types";
import { auth, Client } from "twitter-api-sdk";
import { getAuthClient, requestFindMyUser, TwitterFindMyUserResponse } from "../../Twitter/procedures/twitterOauth";

jest.mock("../../Twitter/procedures/twitterOauth", () => ({
  getAuthClient: jest.fn(),
  requestFindMyUser: jest.fn(),
}));

const MOCK_TWITTER_CLIENT = new Client({} as auth.OAuth2User);

const MOCK_TWITTER_USER: TwitterFindMyUserResponse = {
  id: "123",
  name: "Userguy McTesterson",
  username: "DpoppDev",
};

const sessionKey = "twitter-myOAuthSession";
const code = "ABC123_ACCESSCODE";

beforeEach(() => {
  jest.clearAllMocks();
  (getAuthClient as jest.Mock).mockReturnValue(MOCK_TWITTER_CLIENT);
});

describe("Attempt verification", function () {
  it("handles valid verification attempt", async () => {
    (requestFindMyUser as jest.Mock).mockResolvedValue(MOCK_TWITTER_USER);

    const twitter = new ClearTextTwitterProvider();
    const verifiedPayload = await twitter.verify(
      {
        proofs: {
          sessionKey,
          code,
        },
      } as unknown as RequestPayload,
      {}
    );

    expect(getAuthClient).toBeCalledWith(sessionKey, code, {});
    expect(requestFindMyUser).toBeCalled();
    expect(verifiedPayload).toEqual({
      valid: true,
      record: {
        pii: MOCK_TWITTER_USER.username,
      },
    });
  });

  it("should return invalid payload when there is no username in requestFindMyUser response", async () => {
    (requestFindMyUser as jest.Mock).mockResolvedValue({ username: undefined } as TwitterFindMyUserResponse);

    const twitter = new ClearTextTwitterProvider();

    const verifiedPayload = await twitter.verify(
      {
        proofs: {
          sessionKey,
          code,
        },
      } as unknown as RequestPayload,
      {}
    );

    expect(verifiedPayload).toMatchObject({ valid: false });
  });

  it("should return invalid payload when requestFindMyUser throws", async () => {
    (requestFindMyUser as jest.Mock).mockRejectedValue("unauthorized");

    const twitter = new ClearTextTwitterProvider();

    const verifiedPayload = await twitter.verify(
      {
        proofs: {
          sessionKey,
          code,
        },
      } as unknown as RequestPayload,
      {}
    );

    expect(verifiedPayload).toMatchObject({ valid: false });
  });

  it("should return invalid payload when unable to retrieve twitter oauth client", async () => {
    (getAuthClient as jest.Mock).mockRejectedValue("unauthorized");
    (requestFindMyUser as jest.Mock).mockImplementationOnce(async (client) => {
      return client ? MOCK_TWITTER_USER : {};
    });

    const twitter = new ClearTextTwitterProvider();

    const verifiedPayload = await twitter.verify(
      {
        proofs: {
          sessionKey,
          code,
        },
      } as unknown as RequestPayload,
      {}
    );

    expect(verifiedPayload).toMatchObject({ valid: false });
  });
});
