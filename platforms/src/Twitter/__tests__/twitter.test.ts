// ---- Test subject
import TwitterProvider from "../Providers/TwitterAuthProvider";

import { RequestPayload } from "@gitcoin/passport-types";
import { auth, Client } from "twitter-api-sdk";
import { getAuthClient, requestFindMyUser, TwitterFindMyUserResponse } from "../procedures/twitterOauth";

jest.mock("../procedures/twitterOauth", () => ({
  requestFindMyUser: jest.fn(),
  getAuthClient: jest.fn(),
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

    const twitter = new TwitterProvider();
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
        username: MOCK_TWITTER_USER.username,
      },
    });
  });

  it("should return invalid payload when unable to retrieve twitter oauth client", async () => {
    (requestFindMyUser as jest.Mock).mockResolvedValueOnce((client: TwitterFindMyUserResponse | undefined) => {
      return client ? MOCK_TWITTER_USER : {};
    });

    const twitter = new TwitterProvider();
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

  it("should return invalid payload when there is no username in requestFindMyUser response", async () => {
    (requestFindMyUser as jest.Mock).mockResolvedValue({ username: undefined });

    const twitter = new TwitterProvider();

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

    const twitter = new TwitterProvider();

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
