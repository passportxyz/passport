// ---- Test subject
import {
  TwitterTweetLikesGTE100Provider,
  TwitterTweetRetweetsGTE25Provider,
  TwitterTweetMetricResponse,
  lookupTweetMetricCount,
  getClient,
} from "../src/providers/twitterTweetMetrics";

import { RequestPayload } from "@gitcoin/passport-types";
import { auth } from "twitter-api-sdk";
import { deleteClient } from "../src/procedures/twitterOauth";

jest.mock("../src/procedures/twitterOauth", () => ({
  deleteClient: jest.fn(),
  requestFindMyUser: jest.fn(),
}));

jest.mock("../src/providers/twitterTweetMetrics", () => ({
  getClient: jest.fn(),
  verifyTwitterMetric: jest.fn(),
}));

const MOCK_TWITTER_OAUTH_CLIENT = {} as auth.OAuth2User;

const MOCK_TWITTER_USER: TwitterTweetMetricResponse = {
  username: "PassportDev",
  isMoreThan: true,
};

const sessionKey = "twitter-myOAuthSession";
const code = "ABC123_ACCESSCODE";

beforeEach(() => {
  jest.clearAllMocks();
  (getClient as jest.Mock).mockReturnValue(MOCK_TWITTER_OAUTH_CLIENT);
});

describe("Attempt verification", function () {
  it("handles valid verification attempt", async () => {
    (lookupTweetMetricCount as jest.Mock).mockResolvedValue(MOCK_TWITTER_USER);

    const twitter = new TwitterTweetLikesGTE100Provider();
    const verifiedPayload = await twitter.verify({
      proofs: {
        sessionKey,
        code,
      },
    } as unknown as RequestPayload);

    expect(getClient).toBeCalledWith(sessionKey);
    expect(lookupTweetMetricCount).toBeCalledWith(MOCK_TWITTER_OAUTH_CLIENT, code);
    expect(deleteClient).toBeCalledWith(sessionKey);
    expect(verifiedPayload).toEqual({
      valid: true,
      record: {
        username: "DpoppDev",
        isMoreThan: true,
      },
    });
  });

  it("should return invalid payload when unable to retrieve twitter oauth client", async () => {
    (getClient as jest.Mock).mockReturnValue(undefined);
    (lookupTweetMetricCount as jest.Mock).mockImplementationOnce(async (client) => {
      return client ? MOCK_TWITTER_USER : {};
    });

    const twitter = new TwitterTweetLikesGTE100Provider();

    const verifiedPayload = await twitter.verify({
      proofs: {
        sessionKey,
        code,
      },
    } as unknown as RequestPayload);

    expect(verifiedPayload).toMatchObject({ valid: false });
  });

  it("should return invalid payload when there is no username in requestFindMyUser response", async () => {
    (lookupTweetMetricCount as jest.Mock).mockResolvedValue({ username: undefined });

    const twitter = new TwitterTweetLikesGTE100Provider();

    const verifiedPayload = await twitter.verify({
      proofs: {
        sessionKey,
        code,
      },
    } as unknown as RequestPayload);

    expect(verifiedPayload).toMatchObject({ valid: false });
  });

  it("should return invalid payload when requestFindMyUser throws", async () => {
    (lookupTweetMetricCount as jest.Mock).mockRejectedValue("unauthorized");

    const twitter = new TwitterTweetLikesGTE100Provider();

    const verifiedPayload = await twitter.verify({
      proofs: {
        sessionKey,
        code,
      },
    } as unknown as RequestPayload);

    expect(verifiedPayload).toMatchObject({ valid: false });
  });

  // describe("Invalid cases for tweet retweet count", function () {
  //   it("Expected Greater than or equal to 25 retweets and Retweet Count is 50", async () => {
  //     (lookupTweetMetricCount as jest.Mock).mockResolvedValue({ followerCount: 50 });

  //     const twitter = new TwitterTweetLikesGTE100Provider();

  //     const verifiedPayload = await twitter.verify({
  //       proofs: {
  //         sessionKey,
  //         code,
  //       },
  //     } as unknown as RequestPayload);

  //     expect(verifiedPayload).toMatchObject({ valid: false });
  //   });
  // });
  // describe("Valid case for tweet retweet count", function () {
  //   it("Expected Greater than 100 and Follower Count is 150", async () => {
  //     (lookupTweetMetricCount as jest.Mock).mockResolvedValue({ followerCount: 150 });

  //     const twitter = new TwitterTweetLikesGTE100Provider();

  //     const verifiedPayload = await twitter.verify({
  //       proofs: {
  //         sessionKey,
  //         code,
  //       },
  //     } as unknown as RequestPayload);

  //     expect(verifiedPayload).toMatchObject({ valid: true });
  //   });
  // });
});
