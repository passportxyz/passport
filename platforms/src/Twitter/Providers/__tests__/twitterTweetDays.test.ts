import * as twitterTweetDays from "../twitterTweetDays";
import { RequestPayload, ProviderContext } from "@gitcoin/passport-types";
import { auth, Client } from "twitter-api-sdk";
import { getUserTweetTimeline, getAuthClient } from "../../procedures/twitterOauth";
const { TwitterTweetDaysProvider } = twitterTweetDays;

jest.mock("../../procedures/twitterOauth", () => ({
  getUserTweetTimeline: jest.fn(),
  getAuthClient: jest.fn(),
}));

describe("TwittewTweetDaysProvider", function () {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAuthClient as jest.Mock).mockReturnValue(MOCK_TWITTER_CLIENT);
  });

  const MOCK_TWITTER_CLIENT = new Client({} as auth.OAuth2User);

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

  it("handles gte 30 days tweet count", async () => {
    (getUserTweetTimeline as jest.MockedFunction<typeof getUserTweetTimeline>).mockImplementation(() => {
      return Promise.resolve({
        numberDaysTweeted: 35,
        errors: undefined,
      });
    });

    const mockContext: ProviderContext = {
      twitter: {
        id: "123",
        numberDaysTweeted: 35,
        errors: undefined,
      },
    };

    const provider = new TwitterTweetDaysProvider({ threshold: "30" });
    const result = await provider.verify(mockPayload, mockContext);

    expect(getAuthClient).toBeCalledWith(sessionKey, code, mockContext);
    expect(getAuthClient).toHaveBeenCalledTimes(1);
    expect(getUserTweetTimeline).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      valid: true,
      error: undefined,
      record: { id: "123" },
    });
  });

  it("handles gte 60 days tweet count", async () => {
    (getUserTweetTimeline as jest.MockedFunction<typeof getUserTweetTimeline>).mockImplementation(() => {
      return Promise.resolve({
        numberDaysTweeted: 65,
        errors: undefined,
      });
    });

    const mockContext: ProviderContext = {
      twitter: {
        id: "123",
        numberDaysTweeted: 65,
        errors: undefined,
      },
    };

    const provider = new TwitterTweetDaysProvider({ threshold: "60" });
    const result = await provider.verify(mockPayload, mockContext);

    expect(getAuthClient).toBeCalledWith(sessionKey, code, mockContext);
    expect(getAuthClient).toHaveBeenCalledTimes(1);
    expect(getUserTweetTimeline).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      valid: true,
      error: undefined,
      record: { id: "123" },
    });
  });

  it("handles gte 120 days tweet count", async () => {
    (getUserTweetTimeline as jest.MockedFunction<typeof getUserTweetTimeline>).mockImplementation(() => {
      return Promise.resolve({
        numberDaysTweeted: 120,
        errors: undefined,
      });
    });

    const mockContext: ProviderContext = {
      twitter: {
        id: "123",
        numberDaysTweeted: 120,
        errors: undefined,
      },
    };

    const provider = new TwitterTweetDaysProvider({ threshold: "120" });
    const result = await provider.verify(mockPayload, mockContext);

    expect(getAuthClient).toBeCalledWith(sessionKey, code, mockContext);
    expect(getAuthClient).toHaveBeenCalledTimes(1);
    expect(getUserTweetTimeline).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      valid: true,
      error: undefined,
      record: { id: "123" },
    });
  });

  it("handles invalid account age", async () => {
    (getUserTweetTimeline as jest.MockedFunction<typeof getUserTweetTimeline>).mockImplementation(() => {
      return Promise.resolve({
        numberDaysTweeted: 12,
        errors: undefined,
      });
    });

    const mockContext: ProviderContext = {
      twitter: {
        id: "123",
        numberDaysTweeted: 12,
        errors: undefined,
      },
    };

    const provider = new TwitterTweetDaysProvider({ threshold: "120" });
    const result = await provider.verify(mockPayload, mockContext);

    expect(getAuthClient).toBeCalledWith(sessionKey, code, mockContext);
    expect(getAuthClient).toHaveBeenCalledTimes(1);
    expect(getUserTweetTimeline).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      valid: false,
      error: undefined,
      record: undefined,
    });
  });

  it("handles request errors", async () => {
    (getUserTweetTimeline as jest.MockedFunction<typeof getUserTweetTimeline>).mockImplementation(() => {
      return Promise.resolve({
        numberDaysTweeted: undefined,
        errors: ["Errors"],
      });
    });

    const mockContext: ProviderContext = {
      twitter: {
        id: "123",
        numberDaysTweeted: 35,
        errors: undefined,
      },
    };

    const provider = new TwitterTweetDaysProvider({ threshold: "120" });
    const result = await provider.verify(mockPayload, mockContext);

    expect(getAuthClient).toBeCalledWith(sessionKey, code, mockContext);
    expect(getAuthClient).toHaveBeenCalledTimes(1);
    expect(getUserTweetTimeline).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      valid: false,
      error: ["Errors"],
      record: undefined,
    });
  });
});
