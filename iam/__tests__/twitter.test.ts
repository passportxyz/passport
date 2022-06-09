// ---- Test subject
import { TwitterProvider } from "../src/providers/twitter";

import { RequestPayload } from "@gitcoin/passport-types";
import { auth } from "twitter-api-sdk";
import { deleteClient, getClient, requestFindMyUser, TwitterFindMyUserResponse } from "../src/procedures/twitterOauth";

jest.mock("../src/procedures/twitterOauth", () => ({
  getClient: jest.fn(),
  deleteClient: jest.fn(),
  requestFindMyUser: jest.fn(),
}));

const MOCK_TWITTER_OAUTH_CLIENT = {} as auth.OAuth2User;

const MOCK_TWITTER_USER: TwitterFindMyUserResponse = {
  id: "123",
  name: "Userguy McTesterson",
  username: "DpoppDev",
};

const sessionKey = "twitter-myOAuthSession";
const code = "ABC123_ACCESSCODE";

beforeEach(() => {
  jest.clearAllMocks();
  (getClient as jest.Mock).mockReturnValue(MOCK_TWITTER_OAUTH_CLIENT);
});

describe("Attempt verification", function () {
  it("handles valid verification attempt", async () => {
    (requestFindMyUser as jest.Mock).mockResolvedValue(MOCK_TWITTER_USER);

    const twitter = new TwitterProvider();
    const verifiedPayload = await twitter.verify({
      proofs: {
        sessionKey,
        code,
      },
    } as unknown as RequestPayload);

    expect(getClient).toBeCalledWith(sessionKey);
    expect(requestFindMyUser).toBeCalledWith(MOCK_TWITTER_OAUTH_CLIENT, code);
    expect(deleteClient).toBeCalledWith(sessionKey);
    expect(verifiedPayload).toEqual({
      valid: true,
      record: {
        username: MOCK_TWITTER_USER.username,
      },
    });
  });

  it("should return invalid payload when unable to retrieve twitter oauth client", async () => {
    (getClient as jest.Mock).mockReturnValue(undefined);
    (requestFindMyUser as jest.Mock).mockImplementationOnce(async (client) => {
      return client ? MOCK_TWITTER_USER : {};
    });

    const twitter = new TwitterProvider();

    const verifiedPayload = await twitter.verify({
      proofs: {
        sessionKey,
        code,
      },
    } as unknown as RequestPayload);

    expect(verifiedPayload).toMatchObject({ valid: false });
  });

  it("should return invalid payload when there is no username in requestFindMyUser response", async () => {
    (requestFindMyUser as jest.Mock).mockResolvedValue({ username: undefined });

    const twitter = new TwitterProvider();

    const verifiedPayload = await twitter.verify({
      proofs: {
        sessionKey,
        code,
      },
    } as unknown as RequestPayload);

    expect(verifiedPayload).toMatchObject({ valid: false });
  });

  it("should return invalid payload when requestFindMyUser throws", async () => {
    (requestFindMyUser as jest.Mock).mockRejectedValue("unauthorized");

    const twitter = new TwitterProvider();

    const verifiedPayload = await twitter.verify({
      proofs: {
        sessionKey,
        code,
      },
    } as unknown as RequestPayload);

    expect(verifiedPayload).toMatchObject({ valid: false });
  });
});
