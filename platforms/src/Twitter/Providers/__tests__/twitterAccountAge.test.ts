/* eslint-disable */
import * as twitterAccountAge from "../twitterAccountAge";
import { clearCacheSession } from "../../../utils/cache";
import { RequestPayload, ProviderContext } from "@gitcoin/passport-types";
import { ApiRequestError, ApiResponseError, ApiPartialResponseError } from "twitter-api-v2";
import { getTwitterUserData, getAuthClient, initClientAndGetAuthUrl } from "../../procedures/twitterOauth";
import { TwitterApi } from "twitter-api-v2";
import { ProviderExternalVerificationError } from "../../../types";
import { Providers } from "../../../utils/providers";

const { TwitterAccountAgeProvider } = twitterAccountAge;

jest.mock("../../procedures/twitterOauth", () => {
  const originalModule = jest.requireActual("../../procedures/twitterOauth");
  return {
    ...originalModule,
    getTwitterUserData: jest.fn(),
    getAuthClient: jest.fn(),
  };
});

process.env.TWITTER_CLIENT_ID = "123";
process.env.TWITTER_CLIENT_SECRET = "abc";

describe("TwitterAccountAgeProvider", function () {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAuthClient as jest.Mock).mockReturnValue(MOCK_TWITTER_CLIENT);
  });

  const MOCK_TWITTER_CLIENT = new TwitterApi().readOnly;

  const mockContext: ProviderContext = {};

  const mockPayload: RequestPayload = {
    address: "0x0",
    proofs: {
      code: "ABC123_ACCESSCODE",
      sessionKey: "twitter-myOAuthSession",
    },
    type: "twitterAccountAgeGte#730",
    version: "",
  };

  const sessionKey = mockPayload.proofs.sessionKey;
  const code = mockPayload.proofs.code;

  it("handles valid account age", async () => {
    (getTwitterUserData as jest.MockedFunction<typeof getTwitterUserData>).mockImplementation(() => {
      return Promise.resolve({
        id: "123",
        createdAt: "2019-01-01T00:00:00Z",
        username: "test",
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
        errors: undefined,
        id: "123",
        createdAt: new Date().toISOString(), // Account created today
        username: "test",
      });
    });

    const provider = new TwitterAccountAgeProvider({ threshold: "730" });
    const result = await provider.verify(mockPayload, mockContext);

    expect(getAuthClient).toBeCalledWith(sessionKey, code, mockContext);
    expect(getAuthClient).toHaveBeenCalledTimes(1);
    expect(getTwitterUserData).toHaveBeenCalledTimes(1);
    expect(result.valid).toEqual(false);
    expect(result.errors.length).toEqual(1);
    expect(result.errors[0]).toMatch(/^Twitter account age is less than 730 days/);
  });

  it("handles ApiRequestError", async () => {
    const mockError = {
      requestError: {
        name: "ApiRequestError",
        message: "API request error",
      },
    } as ApiRequestError;
    const { requestError } = mockError;

    const mockProviderExternalVerificationError = new ProviderExternalVerificationError(
      `Error requesting user data: ${requestError.name} ${requestError.message}`
    );

    (getTwitterUserData as jest.MockedFunction<typeof getTwitterUserData>).mockImplementation(() => {
      throw mockProviderExternalVerificationError;
    });

    try {
      const provider = new TwitterAccountAgeProvider({ threshold: "730" });
      await provider.verify(mockPayload, mockContext);
      fail("Expected ProviderExternalVerificationError to be thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(ProviderExternalVerificationError);
      expect(e.message).toContain(`Error requesting user data: ${requestError.name} ${requestError.message}`);
    }
  });

  it("handles ApiResponseError", async () => {
    const mockResponseError = {
      data: {
        error: "Error retrieving user data",
        title: "Mock response error",
        detail: "User not found",
      },
      code: 400,
    } as ApiResponseError;

    const { data, code } = mockResponseError;
    const dataString = JSON.stringify(data);

    const mockProviderExternalVerificationError = new ProviderExternalVerificationError(
      `Error retrieving user data, code ${code}, data: ${dataString}`
    );

    (getTwitterUserData as jest.MockedFunction<typeof getTwitterUserData>).mockImplementation(() => {
      throw mockProviderExternalVerificationError;
    });

    const provider = new TwitterAccountAgeProvider({ threshold: "730" });
    try {
      await provider.verify(mockPayload, mockContext);
      fail("Expected ProviderExternalVerificationError to be thrown");
    } catch (e) {
      console.log(e.message);

      expect(e).toBeInstanceOf(ProviderExternalVerificationError);
      expect(e.message).toContain("Error retrieving user data");
      expect(e.message).toContain("400");
      expect(e.message).toContain("User not found");
    }
  });

  it("handles ApiPartialResponseError", async () => {
    const mockPartialResponseError = {
      rawContent: "PartialError",
      responseError: {
        name: "Api Partial Response Error",
        message: "Data missing",
      },
    } as ApiPartialResponseError;

    const { rawContent, responseError } = mockPartialResponseError;

    const mockProviderExternalVerificationError = new ProviderExternalVerificationError(
      `Retrieving Twitter user data failed to complete, error: ${responseError.name} ${responseError.message}, raw data: ${rawContent}`
    );

    (getTwitterUserData as jest.MockedFunction<typeof getTwitterUserData>).mockImplementation(() => {
      throw mockProviderExternalVerificationError;
    });

    const provider = new TwitterAccountAgeProvider({ threshold: "730" });
    try {
      await provider.verify(mockPayload, mockContext);
      fail("Expected ProviderExternalVerificationError to be thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(ProviderExternalVerificationError);
      expect(e.message).toContain("Retrieving Twitter user data failed to complete");
      expect(e.message).toContain("PartialError");
      expect(e.message).toContain("Data missing");
    }
  });

  it("returns correct error response", async () => {
    (getTwitterUserData as jest.MockedFunction<typeof getTwitterUserData>).mockImplementation(() => {
      return Promise.reject(new ProviderExternalVerificationError("Errors"));
    });

    const provider = new TwitterAccountAgeProvider({ threshold: "730" });
    const providers = new Providers([provider]);
    const result = await providers.verify(mockPayload.type, mockPayload, mockContext);

    expect(getAuthClient).toBeCalledWith(sessionKey, code, mockContext);
    expect(getAuthClient).toHaveBeenCalledTimes(1);
    expect(getTwitterUserData).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      valid: false,
      error: ["Errors"],
      record: undefined,
    });
  });

  it("uses the default callback when no override is provided", async () => {
    const oldCallback = process.env.TWITTER_CALLBACK;
    try {
      process.env.TWITTER_CALLBACK = "test_callback";
      const authUrl = initClientAndGetAuthUrl();
      expect(authUrl).toContain("redirect_uri=test_callback");
      const state = authUrl.split("state=")[1].split("&")[0];
      clearCacheSession(state, "Twitter");
    } finally {
      process.env.TWITTER_CALLBACK = oldCallback;
    }
  });

  it("uses the override callback when provided", async () => {
    const authUrl = initClientAndGetAuthUrl("override_callback");
    expect(authUrl).toContain("redirect_uri=override_callback");
    const state = authUrl.split("state=")[1].split("&")[0];
    clearCacheSession(state, "Twitter");
  });
});
