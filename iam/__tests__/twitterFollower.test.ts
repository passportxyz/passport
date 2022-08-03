// ---- Test subject
import {
  TwitterFollowerGT100Provider,
  TwitterFollowerGT500Provider,
  TwitterFollowerGTE1000Provider,
  TwitterFollowerGT5000Provider,
} from "../src/providers/TwitterFollower";

import { RequestPayload } from "@gitcoin/passport-types";
import { auth } from "twitter-api-sdk";
import { deleteClient, getClient, getFollowerCount, TwitterFollowerResponse } from "../src/procedures/twitterOauth";

jest.mock("../src/procedures/twitterOauth", () => ({
  getClient: jest.fn(),
  deleteClient: jest.fn(),
  getFollowerCount: jest.fn(),
}));

const MOCK_TWITTER_OAUTH_CLIENT = {} as auth.OAuth2User;

const MOCK_TWITTER_USER: TwitterFollowerResponse = {
  id: "123",
  name: "Userguy McTesterson",
  username: "DpoppDev",
  followerCount: 200,
};

const sessionKey = "twitter-myOAuthSession";
const code = "ABC123_ACCESSCODE";

beforeEach(() => {
  jest.clearAllMocks();
  (getClient as jest.Mock).mockReturnValue(MOCK_TWITTER_OAUTH_CLIENT);
});

describe("Attempt verification", function () {
  it("handles valid verification attempt", async () => {
    (getFollowerCount as jest.Mock).mockResolvedValue(MOCK_TWITTER_USER);

    const twitter = new TwitterFollowerGT100Provider();
    const verifiedPayload = await twitter.verify({
      proofs: {
        sessionKey,
        code,
      },
    } as unknown as RequestPayload);

    expect(getClient).toBeCalledWith(sessionKey);
    expect(getFollowerCount).toBeCalledWith(MOCK_TWITTER_OAUTH_CLIENT, code);
    expect(deleteClient).toBeCalledWith(sessionKey);
    expect(verifiedPayload).toEqual({
      valid: true,
      record: {
        followerCount: JSON.stringify(MOCK_TWITTER_USER.followerCount),
      },
    });
  });

  it("should return invalid payload when unable to retrieve twitter oauth client", async () => {
    (getClient as jest.Mock).mockReturnValue(undefined);
    (getFollowerCount as jest.Mock).mockImplementationOnce(async (client) => {
      return client ? MOCK_TWITTER_USER : {};
    });

    const twitter = new TwitterFollowerGT100Provider();

    const verifiedPayload = await twitter.verify({
      proofs: {
        sessionKey,
        code,
      },
    } as unknown as RequestPayload);

    expect(verifiedPayload).toMatchObject({ valid: false });
  });

  it("should return invalid payload when there is no username in requestFindMyUser response", async () => {
    (getFollowerCount as jest.Mock).mockResolvedValue({ username: undefined });

    const twitter = new TwitterFollowerGT100Provider();

    const verifiedPayload = await twitter.verify({
      proofs: {
        sessionKey,
        code,
      },
    } as unknown as RequestPayload);

    expect(verifiedPayload).toMatchObject({ valid: false });
  });

  it("should return invalid payload when requestFindMyUser throws", async () => {
    (getFollowerCount as jest.Mock).mockRejectedValue("unauthorized");

    const twitter = new TwitterFollowerGT100Provider();

    const verifiedPayload = await twitter.verify({
      proofs: {
        sessionKey,
        code,
      },
    } as unknown as RequestPayload);

    expect(verifiedPayload).toMatchObject({ valid: false });
  });

  describe("Check invalid cases for follower ranges", function () {
    it("Expected Greater than 100 and Follower Count is 50", async () => {
      (getFollowerCount as jest.Mock).mockResolvedValue({ followerCount: 50 });

      const twitter = new TwitterFollowerGT100Provider();

      const verifiedPayload = await twitter.verify({
        proofs: {
          sessionKey,
          code,
        },
      } as unknown as RequestPayload);

      expect(verifiedPayload).toMatchObject({ valid: false });
    });

    it("Expected Greater than 500 and Follower Count is 150", async () => {
      (getFollowerCount as jest.Mock).mockResolvedValue({ followerCount: 150 });

      const twitter = new TwitterFollowerGT500Provider();

      const verifiedPayload = await twitter.verify({
        proofs: {
          sessionKey,
          code,
        },
      } as unknown as RequestPayload);

      expect(verifiedPayload).toMatchObject({ valid: false });
    });

    it("Expected Greater than or equal to 1000 and Follower Count is 150", async () => {
      (getFollowerCount as jest.Mock).mockResolvedValue({ followerCount: 900 });

      const twitter = new TwitterFollowerGTE1000Provider();

      const verifiedPayload = await twitter.verify({
        proofs: {
          sessionKey,
          code,
        },
      } as unknown as RequestPayload);

      expect(verifiedPayload).toMatchObject({ valid: false });
    });

    it("Expected Greater than 5000 and Follower Count is 150", async () => {
      (getFollowerCount as jest.Mock).mockResolvedValue({ followerCount: 2500 });

      const twitter = new TwitterFollowerGT5000Provider();

      const verifiedPayload = await twitter.verify({
        proofs: {
          sessionKey,
          code,
        },
      } as unknown as RequestPayload);

      expect(verifiedPayload).toMatchObject({ valid: false });
    });
  });
});
