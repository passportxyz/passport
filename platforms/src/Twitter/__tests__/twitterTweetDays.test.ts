import * as twitterTweetDays from "../Providers/twitterTweetDays";
import { RequestPayload, ProviderContext } from "@gitcoin/passport-types";
import { auth, Client } from "twitter-api-sdk";
import { getTwitterUserData, getAuthClient } from "../procedures/twitterOauth";

// const { TwitterTweetDaysProvider } = twitterTweetDays;

jest.mock("../procedures/twitterOauth", () => ({
  getTwitterUserData: jest.fn(),
  getAuthClient: jest.fn(),
}));

describe("TwittewTweetDaysProvider", function () {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAuthClient as jest.Mock).mockReturnValue(MOCK_TWITTER_CLIENT);
  });

  const MOCK_TWITTER_CLIENT = new Client({} as auth.OAuth2User);

  const mockContext: ProviderContext = {
    twitter: {
      id: "123",
    },
  };

  const mockPayload: RequestPayload = {
    address: "0x0",
    proofs: {
      code: "ABC123_ACCESSCODE",
      sessionKey: "twitter-myOAuthSession",
    },
    type: "",
    version: "",
  };

  const sessionKey = mockPayload.proofs.sessionKey;
  const code = mockPayload.proofs.code;

  it("handles valid tweet days count", async () => {
    // TODO: add tests
  });
});
