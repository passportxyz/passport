// ---- Test subject
import { TwitterTweetGT10Provider } from "../Providers/TwitterTweetsProvider";

import { RequestPayload } from "@gitcoin/passport-types";
import { auth } from "twitter-api-sdk";
import { getClient, getTweetCount, TwitterTweetResponse } from "../procedures/twitterOauth";

jest.mock("../procedures/twitterOauth", () => ({
  getClient: jest.fn(),
  getTweetCount: jest.fn(),
}));

const MOCK_TWITTER_OAUTH_CLIENT = {} as auth.OAuth2User;

const MOCK_TWITTER_USER: TwitterTweetResponse = {
  username: "DpoppDev",
  tweetCount: 200,
};

const sessionKey = "twitter-myOAuthSession";
const code = "ABC123_ACCESSCODE";

beforeEach(() => {
  jest.clearAllMocks();
  (getClient as jest.Mock).mockReturnValue(MOCK_TWITTER_OAUTH_CLIENT);
});

describe("Attempt verification", function () {
  it("handles valid verification attempt", async () => {
    (getTweetCount as jest.Mock).mockResolvedValue(MOCK_TWITTER_USER);

    const twitter = new TwitterTweetGT10Provider();
    const verifiedPayload = await twitter.verify({
      proofs: {
        sessionKey,
        code,
      },
    } as unknown as RequestPayload);

    expect(getClient).toBeCalledWith(sessionKey);
    expect(getTweetCount).toBeCalledWith(MOCK_TWITTER_OAUTH_CLIENT, code);
    expect(verifiedPayload).toEqual({
      valid: true,
      record: {
        username: "DpoppDev",
        tweetCount: "gt10",
      },
    });
  });

  it("should return invalid payload when unable to retrieve twitter oauth client", async () => {
    (getClient as jest.Mock).mockReturnValue(undefined);
    (getTweetCount as jest.Mock).mockImplementationOnce(async (client) => {
      return Promise.resolve(client ? MOCK_TWITTER_USER : {});
    });

    const twitter = new TwitterTweetGT10Provider();

    const verifiedPayload = await twitter.verify({
      proofs: {
        sessionKey,
        code,
      },
    } as unknown as RequestPayload);

    expect(verifiedPayload).toMatchObject({ valid: false });
  });

  it("should return invalid payload when there is no username in requestFindMyUser response", async () => {
    (getTweetCount as jest.Mock).mockResolvedValue({ username: undefined });

    const twitter = new TwitterTweetGT10Provider();

    const verifiedPayload = await twitter.verify({
      proofs: {
        sessionKey,
        code,
      },
    } as unknown as RequestPayload);

    expect(verifiedPayload).toMatchObject({ valid: false });
  });

  it("should return invalid payload when requestFindMyUser throws", async () => {
    (getTweetCount as jest.Mock).mockRejectedValue("unauthorized");

    const twitter = new TwitterTweetGT10Provider();

    const verifiedPayload = await twitter.verify({
      proofs: {
        sessionKey,
        code,
      },
    } as unknown as RequestPayload);

    expect(verifiedPayload).toMatchObject({ valid: false });
  });
  it("should return invalid payload when tweet count is 5", async () => {
    (getTweetCount as jest.Mock).mockResolvedValue({ username: "DpoppDev", tweetCount: 5 });

    const twitter = new TwitterTweetGT10Provider();

    const verifiedPayload = await twitter.verify({
      proofs: {
        sessionKey,
        code,
      },
    } as unknown as RequestPayload);

    expect(verifiedPayload).toMatchObject({ valid: false });
  });
  it("should return valid payload when tweet count is 20", async () => {
    (getTweetCount as jest.Mock).mockResolvedValue({ username: "DpoppDev", tweetCount: 20 });

    const twitter = new TwitterTweetGT10Provider();

    const verifiedPayload = await twitter.verify({
      proofs: {
        sessionKey,
        code,
      },
    } as unknown as RequestPayload);

    expect(verifiedPayload).toMatchObject({ valid: true });
  });
});
