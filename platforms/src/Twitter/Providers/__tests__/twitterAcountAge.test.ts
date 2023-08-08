import * as twitterAccountAge from "../twitterAccountAge";
import { RequestPayload, ProviderContext } from "@gitcoin/passport-types";
import { getTwitterUserData, getAuthClient, initClientAndGetAuthUrl } from "../../procedures/twitterOauth";

const { TwitterAccountAgeProvider } = twitterAccountAge;

process.env.TWITTER_APP_KEY= "test_client_id";
process.env.TWITTER_APP_SECRET = "test_client_secret";
process.env.TWITTER_CALLBACK = "test_callback";

jest.mock("../../procedures/twitterOauth", () => ({
  getTwitterUserData: jest.fn(),
  getAuthClient: jest.fn(),
  initClientAndGetAuthUrl: jest.fn().mockReturnValue("mocked_url"),
  initCacheSession: jest.fn(),
  loadTwitterCache: jest.fn().mockReturnValue({}),
}));

jest.mock("twitter-api-v2", () => ({
  TwitterApi: jest.fn().mockImplementation(() => ({
    readOnly: {
      generateOAuth2AuthLink: jest.fn().mockReturnValue({
        url: "mocked_url",
        codeVerifier: "mocked_codeVerifier",
        state: "mocked_state",
      }),
    },
  })),
}));

describe("TwitterAccountAgeProvider", function () {
  beforeEach(() => {
    jest.clearAllMocks();
    getAuthClient as jest.Mock;
  });

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

  it("should initialize client and get auth url", async () => {
    const result = initClientAndGetAuthUrl();
    expect(result).toBe("mocked_url");
  });

  it("handles valid account age", async () => {
    (getTwitterUserData as jest.MockedFunction<typeof getTwitterUserData>).mockImplementation(() => {
      return Promise.resolve({
        createdAt: "2019-01-01T00:00:00Z",
        id: "123",
      });
    });

    const provider = new TwitterAccountAgeProvider({ threshold: "730" });
    const result = await provider.verify(mockPayload, mockContext);

    expect(getAuthClient).toBeCalledWith(sessionKey, code, mockContext);
    expect(getAuthClient).toHaveBeenCalledTimes(1);
    expect(getTwitterUserData).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      valid: true,
      errors: [],
      record: { id: "123" },
    });
  });

  it("handles invalid account age", async () => {
    (getTwitterUserData as jest.MockedFunction<typeof getTwitterUserData>).mockImplementation(() => {
      return Promise.resolve({
        createdAt: "2023-08-08T00:00:00Z", // Account created today
        id: "123"
      });
    });

    const provider = new TwitterAccountAgeProvider({ threshold: "730" });
    const result = await provider.verify(mockPayload, mockContext);

    expect(getAuthClient).toBeCalledWith(sessionKey, code, mockContext);
    expect(getAuthClient).toHaveBeenCalledTimes(1);
    expect(getTwitterUserData).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      valid: false,
      errors: ["Twitter account age is less than 730 days (created at 2023-08-08T00:00:00Z)"],
      record: {
        id: "123",
      },
    });
  });

  it("handles request errors", async () => {
    (getTwitterUserData as jest.MockedFunction<typeof getTwitterUserData>).mockImplementation(() => {
      return Promise.resolve({
        createdAt: undefined,
        id: undefined,
      });
    });

    const provider = new TwitterAccountAgeProvider({ threshold: "730" });
    const result = await provider.verify(mockPayload, mockContext);

    expect(getAuthClient).toBeCalledWith(sessionKey, code, mockContext);
    expect(getAuthClient).toHaveBeenCalledTimes(1);
    expect(getTwitterUserData).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      valid: false,
      errors: ["Twitter account age is less than 730 days (created at undefined)"],
      record: {
        id: undefined,
      },
    });
  });
});
