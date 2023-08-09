/* eslint-disable */
import * as twitterAccountAge from "../twitterAccountAge";
import { RequestPayload, ProviderContext } from "@gitcoin/passport-types";
import { ApiRequestError, ApiResponseError, ApiPartialResponseError } from "twitter-api-v2";
import { getTwitterUserData, getAuthClient, initClientAndGetAuthUrl } from "../../procedures/twitterOauth";
import { ProviderExternalVerificationError } from "../../../types";

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

  it("handles ApiRequestError", async () => {
    const mockError = {
        requestError: {
          name: "ApiRequestError",
          message: "API request error"
        }
    } as ApiRequestError;
    const { requestError } = mockError;
      
    const mockProviderExternalVerificationError = new ProviderExternalVerificationError(`Error requesting user data: ${requestError.name} ${requestError.message}`);

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
    const dataString = JSON.stringify(data)

    const mockProviderExternalVerificationError = new ProviderExternalVerificationError( `Error retrieving user data, code ${code}, data: ${dataString}`);

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
        message: "Data missing"
      },
    } as ApiPartialResponseError;

    const { rawContent, responseError } = mockPartialResponseError;
    
    const mockProviderExternalVerificationError = new ProviderExternalVerificationError( `Retrieving Twitter user data failed to complete, error: ${responseError.name} ${responseError.message}, raw data: ${rawContent}`);

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
});
