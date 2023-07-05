import * as twitterAccountAge from "../Providers/twitterAccountAge";
import { RequestPayload, ProviderContext } from "@gitcoin/passport-types";
import { auth, Client } from "twitter-api-sdk";
import { getTwitterUserData, getAuthClient } from "../procedures/twitterOauth";

const { TwitterAccountAgeProvider } = twitterAccountAge;

jest.mock("../procedures/twitterOauth", () => ({
  getTwitterUserData: jest.fn(),
  getAuthClient: jest.fn(),
}));

describe("TwitterAccountAgeProvider", function () {
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

  it("handles valid account age", async () => {
    (getTwitterUserData as jest.MockedFunction<typeof getTwitterUserData>).mockImplementation(() => {
      return Promise.resolve({
        createdAt: "2019-01-01T00:00:00Z",
        errors: undefined,
      });
    });

    const provider = new TwitterAccountAgeProvider({ threshold: "730" });
    const result = await provider.verify(mockPayload, mockContext);

    expect(getAuthClient).toBeCalledWith(sessionKey, code, mockContext);
    expect(getAuthClient).toHaveBeenCalledTimes(1);
    expect(getTwitterUserData).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      valid: true,
      error: undefined,
      record: { id: "123" },
    });
  });

  it("handles invalid account age", async () => {
    (getTwitterUserData as jest.MockedFunction<typeof getTwitterUserData>).mockImplementation(() => {
      return Promise.resolve({
        createdAt: new Date().toISOString(), // Account created today
        errors: undefined,
      });
    });

    const provider = new TwitterAccountAgeProvider({ threshold: "730" });
    const result = await provider.verify(mockPayload, mockContext);

    expect(getAuthClient).toBeCalledWith(sessionKey, code, mockContext);
    expect(getAuthClient).toHaveBeenCalledTimes(1);
    expect(getTwitterUserData).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      valid: false,
      error: undefined,
      record: undefined,
    });
  });

  it("handles request errors", async () => {
    (getTwitterUserData as jest.MockedFunction<typeof getTwitterUserData>).mockImplementation(() => {
      return Promise.resolve({
        createdAt: undefined,
        errors: ["Errors"],
      });
    });

    const provider = new TwitterAccountAgeProvider({ threshold: "730" });
    const result = await provider.verify(mockPayload, mockContext);

    expect(getAuthClient).toBeCalledWith(sessionKey, code, mockContext);
    expect(getAuthClient).toHaveBeenCalledTimes(1);
    expect(getTwitterUserData).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      valid: false,
      error: ["Errors"],
      record: undefined,
    });
  });
});
