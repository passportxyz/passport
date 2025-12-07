// TODO - Remove once ts lint has been unified across packages

// ---- Test subject
import { XProvider } from "../Providers/x.js";

import { RequestPayload } from "@gitcoin/passport-types";
import { TwitterApiReadOnly } from "twitter-api-v2";
import { getAuthClient, TwitterContext } from "../../Twitter/procedures/twitterOauth.js";
import { ProviderExternalVerificationError } from "../../types.js";

jest.mock("../../Twitter/procedures/twitterOauth", () => ({
  getAuthClient: jest.fn(),
}));

// Mock the Twitter API client
const MOCK_TWITTER_CLIENT = {
  v2: {
    me: jest.fn(),
  },
} as unknown as TwitterApiReadOnly;

const sessionKey = "twitter-myOAuthSession";
const code = "ABC123_ACCESSCODE";

// Helper to create mock user data
const createMockUserData = (overrides = {}) => {
  const now = new Date();
  const oneYearAgo = new Date(now.getTime() - 366 * 24 * 60 * 60 * 1000); // 366 days ago

  return {
    data: {
      id: "123456789",
      username: "testuser",
      created_at: oneYearAgo.toISOString(),
      public_metrics: {
        followers_count: 150,
      },
      verified: true,
      verified_type: "blue",
      ...overrides,
    },
  };
};

beforeEach(() => {
  jest.clearAllMocks();
  (getAuthClient as jest.Mock).mockResolvedValue(MOCK_TWITTER_CLIENT);
});

describe("XProvider", function () {
  describe("Successful verification", function () {
    it("should verify account meeting all criteria - Premium (blue)", async () => {
      (MOCK_TWITTER_CLIENT.v2.me as jest.Mock).mockResolvedValue(
        createMockUserData({
          verified_type: "blue",
          public_metrics: { followers_count: 200 },
        })
      );

      const xProvider = new XProvider();
      const verifiedPayload = await xProvider.verify(
        {
          proofs: {
            sessionKey,
            code,
          },
        } as unknown as RequestPayload,
        {} as TwitterContext
      );

      expect(getAuthClient).toHaveBeenCalledWith(sessionKey, code, {});
      expect(verifiedPayload).toEqual({
        valid: true,
        record: {
          id: "123456789",
        },
        errors: undefined,
      });
    });

    it("should verify account meeting all criteria - Premium+ (blue_plus)", async () => {
      (MOCK_TWITTER_CLIENT.v2.me as jest.Mock).mockResolvedValue(
        createMockUserData({
          verified_type: "blue_plus",
        })
      );

      const xProvider = new XProvider();
      const verifiedPayload = await xProvider.verify(
        {
          proofs: {
            sessionKey,
            code,
          },
        } as unknown as RequestPayload,
        {} as TwitterContext
      );

      expect(verifiedPayload.valid).toBe(true);
    });

    it("should verify account meeting all criteria - Business (gold)", async () => {
      (MOCK_TWITTER_CLIENT.v2.me as jest.Mock).mockResolvedValue(
        createMockUserData({
          verified_type: "gold",
        })
      );

      const xProvider = new XProvider();
      const verifiedPayload = await xProvider.verify(
        {
          proofs: {
            sessionKey,
            code,
          },
        } as unknown as RequestPayload,
        {} as TwitterContext
      );

      expect(verifiedPayload.valid).toBe(true);
    });

    it("should verify account meeting all criteria - Government (gray)", async () => {
      (MOCK_TWITTER_CLIENT.v2.me as jest.Mock).mockResolvedValue(
        createMockUserData({
          verified_type: "gray",
        })
      );

      const xProvider = new XProvider();
      const verifiedPayload = await xProvider.verify(
        {
          proofs: {
            sessionKey,
            code,
          },
        } as unknown as RequestPayload,
        {} as TwitterContext
      );

      expect(verifiedPayload.valid).toBe(true);
    });

    it("should verify account meeting all criteria - Legacy (blue_legacy)", async () => {
      (MOCK_TWITTER_CLIENT.v2.me as jest.Mock).mockResolvedValue(
        createMockUserData({
          verified_type: "blue_legacy",
        })
      );

      const xProvider = new XProvider();
      const verifiedPayload = await xProvider.verify(
        {
          proofs: {
            sessionKey,
            code,
          },
        } as unknown as RequestPayload,
        {} as TwitterContext
      );

      expect(verifiedPayload.valid).toBe(true);
    });

    it("should verify account meeting all criteria - Legacy (verified: true)", async () => {
      (MOCK_TWITTER_CLIENT.v2.me as jest.Mock).mockResolvedValue(
        createMockUserData({
          verified: true,
          verified_type: undefined,
        })
      );

      const xProvider = new XProvider();
      const verifiedPayload = await xProvider.verify(
        {
          proofs: {
            sessionKey,
            code,
          },
        } as unknown as RequestPayload,
        {} as TwitterContext
      );

      expect(verifiedPayload.valid).toBe(true);
    });

    it("should verify account with exactly 100 followers", async () => {
      (MOCK_TWITTER_CLIENT.v2.me as jest.Mock).mockResolvedValue(
        createMockUserData({
          public_metrics: { followers_count: 100 },
        })
      );

      const xProvider = new XProvider();
      const verifiedPayload = await xProvider.verify(
        {
          proofs: {
            sessionKey,
            code,
          },
        } as unknown as RequestPayload,
        {} as TwitterContext
      );

      expect(verifiedPayload.valid).toBe(true);
    });

    it("should verify account with exactly 366 days old", async () => {
      const now = new Date();
      const exactly366DaysAgo = new Date(now.getTime() - 366 * 24 * 60 * 60 * 1000);

      (MOCK_TWITTER_CLIENT.v2.me as jest.Mock).mockResolvedValue(
        createMockUserData({
          created_at: exactly366DaysAgo.toISOString(),
        })
      );

      const xProvider = new XProvider();
      const verifiedPayload = await xProvider.verify(
        {
          proofs: {
            sessionKey,
            code,
          },
        } as unknown as RequestPayload,
        {} as TwitterContext
      );

      expect(verifiedPayload.valid).toBe(true);
    });
  });

  describe("Follower count validation", function () {
    it("should fail with insufficient followers (< 100)", async () => {
      (MOCK_TWITTER_CLIENT.v2.me as jest.Mock).mockResolvedValue(
        createMockUserData({
          public_metrics: { followers_count: 50 },
        })
      );

      const xProvider = new XProvider();
      const verifiedPayload = await xProvider.verify(
        {
          proofs: {
            sessionKey,
            code,
          },
        } as unknown as RequestPayload,
        {} as TwitterContext
      );

      expect(verifiedPayload.valid).toBe(false);
      expect(verifiedPayload.errors).toContain(
        "Your X account has 50 followers. This stamp requires at least 100 followers."
      );
    });

    it("should fail with 0 followers", async () => {
      (MOCK_TWITTER_CLIENT.v2.me as jest.Mock).mockResolvedValue(
        createMockUserData({
          public_metrics: { followers_count: 0 },
        })
      );

      const xProvider = new XProvider();
      const verifiedPayload = await xProvider.verify(
        {
          proofs: {
            sessionKey,
            code,
          },
        } as unknown as RequestPayload,
        {} as TwitterContext
      );

      expect(verifiedPayload.valid).toBe(false);
      expect(verifiedPayload.errors).toContain(
        "Your X account has 0 followers. This stamp requires at least 100 followers."
      );
    });

    it("should handle missing followers count", async () => {
      (MOCK_TWITTER_CLIENT.v2.me as jest.Mock).mockResolvedValue(
        createMockUserData({
          public_metrics: { followers_count: undefined },
        })
      );

      const xProvider = new XProvider();
      const verifiedPayload = await xProvider.verify(
        {
          proofs: {
            sessionKey,
            code,
          },
        } as unknown as RequestPayload,
        {} as TwitterContext
      );

      expect(verifiedPayload.valid).toBe(false);
      expect(verifiedPayload.errors).toContain(
        "Your X account has 0 followers. This stamp requires at least 100 followers."
      );
    });
  });

  describe("Account age validation", function () {
    it("should fail with account age <= 365 days", async () => {
      const now = new Date();
      const exactly365DaysAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

      (MOCK_TWITTER_CLIENT.v2.me as jest.Mock).mockResolvedValue(
        createMockUserData({
          created_at: exactly365DaysAgo.toISOString(),
        })
      );

      const xProvider = new XProvider();
      const verifiedPayload = await xProvider.verify(
        {
          proofs: {
            sessionKey,
            code,
          },
        } as unknown as RequestPayload,
        {} as TwitterContext
      );

      expect(verifiedPayload.valid).toBe(false);
      expect(verifiedPayload.errors).toContain(
        "Your X account is 365 days old. This stamp requires accounts older than 365 days."
      );
    });

    it("should fail with very new account (< 30 days)", async () => {
      const now = new Date();
      const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

      (MOCK_TWITTER_CLIENT.v2.me as jest.Mock).mockResolvedValue(
        createMockUserData({
          created_at: tenDaysAgo.toISOString(),
        })
      );

      const xProvider = new XProvider();
      const verifiedPayload = await xProvider.verify(
        {
          proofs: {
            sessionKey,
            code,
          },
        } as unknown as RequestPayload,
        {} as TwitterContext
      );

      expect(verifiedPayload.valid).toBe(false);
      expect(verifiedPayload.errors).toContain(
        "Your X account is 10 days old. This stamp requires accounts older than 365 days."
      );
    });

    it("should fail when created_at is missing", async () => {
      (MOCK_TWITTER_CLIENT.v2.me as jest.Mock).mockResolvedValue(
        createMockUserData({
          created_at: undefined,
        })
      );

      const xProvider = new XProvider();
      const verifiedPayload = await xProvider.verify(
        {
          proofs: {
            sessionKey,
            code,
          },
        } as unknown as RequestPayload,
        {} as TwitterContext
      );

      expect(verifiedPayload.valid).toBe(false);
      expect(verifiedPayload.errors).toContain("Unable to verify account creation date.");
    });
  });

  describe("Verification status validation", function () {
    it("should fail without verified status", async () => {
      (MOCK_TWITTER_CLIENT.v2.me as jest.Mock).mockResolvedValue(
        createMockUserData({
          verified: false,
          verified_type: undefined,
        })
      );

      const xProvider = new XProvider();
      const verifiedPayload = await xProvider.verify(
        {
          proofs: {
            sessionKey,
            code,
          },
        } as unknown as RequestPayload,
        {} as TwitterContext
      );

      expect(verifiedPayload.valid).toBe(false);
      expect(verifiedPayload.errors).toContain(
        "This stamp requires a verified X account (Premium, Premium+, Government, Business, or Legacy)."
      );
    });

    it("should fail with unsupported verification type", async () => {
      (MOCK_TWITTER_CLIENT.v2.me as jest.Mock).mockResolvedValue(
        createMockUserData({
          verified_type: "unsupported_type",
          verified: false,
        })
      );

      const xProvider = new XProvider();
      const verifiedPayload = await xProvider.verify(
        {
          proofs: {
            sessionKey,
            code,
          },
        } as unknown as RequestPayload,
        {} as TwitterContext
      );

      expect(verifiedPayload.valid).toBe(false);
      expect(verifiedPayload.errors).toContain(
        "This stamp requires a verified X account (Premium, Premium+, Government, Business, or Legacy)."
      );
    });
  });

  describe("Multiple criteria failures", function () {
    it("should return all errors when multiple criteria fail", async () => {
      const now = new Date();
      const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

      (MOCK_TWITTER_CLIENT.v2.me as jest.Mock).mockResolvedValue(
        createMockUserData({
          verified: false,
          verified_type: undefined,
          public_metrics: { followers_count: 50 },
          created_at: tenDaysAgo.toISOString(),
        })
      );

      const xProvider = new XProvider();
      const verifiedPayload = await xProvider.verify(
        {
          proofs: {
            sessionKey,
            code,
          },
        } as unknown as RequestPayload,
        {} as TwitterContext
      );

      expect(verifiedPayload.valid).toBe(false);
      expect(verifiedPayload.errors).toHaveLength(3);
      expect(verifiedPayload.errors).toContain(
        "Your X account has 50 followers. This stamp requires at least 100 followers."
      );
      expect(verifiedPayload.errors).toContain(
        "Your X account is 10 days old. This stamp requires accounts older than 365 days."
      );
      expect(verifiedPayload.errors).toContain(
        "This stamp requires a verified X account (Premium, Premium+, Government, Business, or Legacy)."
      );
    });
  });

  describe("Error handling", function () {
    it("should handle missing OAuth session data", async () => {
      const xProvider = new XProvider();
      const verifiedPayload = await xProvider.verify(
        {
          proofs: {},
        } as unknown as RequestPayload,
        {} as TwitterContext
      );

      expect(verifiedPayload.valid).toBe(false);
      expect(verifiedPayload.errors).toContain(
        "Missing OAuth session data. Please try connecting your X account again."
      );
    });

    it("should handle missing user ID", async () => {
      (MOCK_TWITTER_CLIENT.v2.me as jest.Mock).mockResolvedValue(
        createMockUserData({
          id: undefined,
        })
      );

      const xProvider = new XProvider();
      const verifiedPayload = await xProvider.verify(
        {
          proofs: {
            sessionKey,
            code,
          },
        } as unknown as RequestPayload,
        {} as TwitterContext
      );

      expect(verifiedPayload.valid).toBe(false);
      expect(verifiedPayload.errors).toContain(
        "We were not able to verify an X account with your provided credentials."
      );
    });

    it("should handle API errors from getAuthClient", async () => {
      (getAuthClient as jest.Mock).mockRejectedValue(new ProviderExternalVerificationError("OAuth error"));

      const xProvider = new XProvider();

      await expect(
        xProvider.verify(
          {
            proofs: {
              sessionKey,
              code,
            },
          } as unknown as RequestPayload,
          {} as TwitterContext
        )
      ).rejects.toThrow(ProviderExternalVerificationError);
    });

    it("should handle API errors from Twitter API", async () => {
      (MOCK_TWITTER_CLIENT.v2.me as jest.Mock).mockRejectedValue(new Error("Twitter API error"));

      const xProvider = new XProvider();

      await expect(
        xProvider.verify(
          {
            proofs: {
              sessionKey,
              code,
            },
          } as unknown as RequestPayload,
          {} as TwitterContext
        )
      ).rejects.toThrow(ProviderExternalVerificationError);
    });
  });
});
