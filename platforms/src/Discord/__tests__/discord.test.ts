// ---- Test subject
import { DiscordProvider } from "../Providers/discord.js";

import { RequestPayload } from "@gitcoin/passport-types";

// ----- Libs
import axios from "axios";
import { ProviderExternalVerificationError } from "../../types.js";

jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;

const code = "ABC123_ACCESSCODE";

// Helper to create a Discord snowflake ID for a specific age
const createSnowflakeId = (daysOld: number): string => {
  const now = Date.now();
  const createdAt = now - daysOld * 24 * 60 * 60 * 1000;
  const discordEpoch = 1420070400000;
  const timestamp = createdAt - discordEpoch;
  const snowflake = BigInt(timestamp) << 22n;
  return snowflake.toString();
};

const validAccessTokenResponse = {
  data: {
    access_token: "762165719dhiqudgasyuqwt6235",
  },
  status: 200,
};

describe("Discord Enhanced Verification", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("All criteria pass", () => {
    it("should verify successfully when all requirements are met", async () => {
      const testUserId = createSnowflakeId(400); // Create once and reuse

      // Mock token exchange
      mockedAxios.post.mockResolvedValue(validAccessTokenResponse);

      // Mock API responses
      mockedAxios.get.mockImplementation(async (url) => {
        if (url.includes("/oauth2/@me")) {
          return {
            data: {
              user: {
                id: testUserId,
                username: "TestUser",
              },
            },
            status: 200,
          };
        }

        if (url.includes("/users/@me/guilds")) {
          // Return 15 guilds (> 10 required)
          return {
            data: Array.from({ length: 15 }, (_, i) => ({
              id: `guild_${i}`,
              name: `Server ${i}`,
            })),
            status: 200,
          };
        }

        if (url.includes("/connections")) {
          // Return 2 verified connections (>= 2 required)
          return {
            data: [
              { type: "github", name: "testuser", verified: true },
              { type: "twitter", name: "testuser", verified: true },
              { type: "steam", name: "testuser", verified: false },
            ],
            status: 200,
          };
        }
      });

      const discord = new DiscordProvider();
      const result = await discord.verify({
        proofs: { code },
      } as unknown as RequestPayload);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.record).toBeDefined();
      expect(result.record?.id).toBe(testUserId);
    });
  });

  describe("Account age validation", () => {
    it("should fail when account is less than 365 days old", async () => {
      mockedAxios.post.mockResolvedValue(validAccessTokenResponse);

      mockedAxios.get.mockImplementation(async (url) => {
        if (url.includes("/oauth2/@me")) {
          return {
            data: {
              user: {
                id: createSnowflakeId(200), // Only 200 days old
                username: "TestUser",
              },
            },
            status: 200,
          };
        }

        if (url.includes("/users/@me/guilds")) {
          return {
            data: Array.from({ length: 15 }, (_, i) => ({
              id: `guild_${i}`,
              name: `Server ${i}`,
            })),
            status: 200,
          };
        }

        if (url.includes("/connections")) {
          return {
            data: [
              { type: "github", name: "testuser", verified: true },
              { type: "twitter", name: "testuser", verified: true },
            ],
            status: 200,
          };
        }
      });

      const discord = new DiscordProvider();
      const result = await discord.verify({
        proofs: { code },
      } as unknown as RequestPayload);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Discord account must be at least 365 days old (current: 200 days)");
    });
  });

  describe("Server count validation", () => {
    it("should fail when user is in less than 10 servers", async () => {
      mockedAxios.post.mockResolvedValue(validAccessTokenResponse);

      mockedAxios.get.mockImplementation(async (url) => {
        if (url.includes("/oauth2/@me")) {
          return {
            data: {
              user: {
                id: createSnowflakeId(400),
                username: "TestUser",
              },
            },
            status: 200,
          };
        }

        if (url.includes("/users/@me/guilds")) {
          // Only 5 guilds
          return {
            data: Array.from({ length: 5 }, (_, i) => ({
              id: `guild_${i}`,
              name: `Server ${i}`,
            })),
            status: 200,
          };
        }

        if (url.includes("/connections")) {
          return {
            data: [
              { type: "github", name: "testuser", verified: true },
              { type: "twitter", name: "testuser", verified: true },
            ],
            status: 200,
          };
        }
      });

      const discord = new DiscordProvider();
      const result = await discord.verify({
        proofs: { code },
      } as unknown as RequestPayload);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Must be a member of at least 10 servers (current: 5)");
    });
  });

  describe("Verified connections validation", () => {
    it("should fail when user has less than 2 verified connections", async () => {
      mockedAxios.post.mockResolvedValue(validAccessTokenResponse);

      mockedAxios.get.mockImplementation(async (url) => {
        if (url.includes("/oauth2/@me")) {
          return {
            data: {
              user: {
                id: createSnowflakeId(400),
                username: "TestUser",
              },
            },
            status: 200,
          };
        }

        if (url.includes("/users/@me/guilds")) {
          return {
            data: Array.from({ length: 15 }, (_, i) => ({
              id: `guild_${i}`,
              name: `Server ${i}`,
            })),
            status: 200,
          };
        }

        if (url.includes("/connections")) {
          // Only 1 verified connection
          return {
            data: [
              { type: "github", name: "testuser", verified: true },
              { type: "twitter", name: "testuser", verified: false },
              { type: "steam", name: "testuser", verified: false },
            ],
            status: 200,
          };
        }
      });

      const discord = new DiscordProvider();
      const result = await discord.verify({
        proofs: { code },
      } as unknown as RequestPayload);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Must have at least 2 verified external connections (current: 1)");
    });
  });

  describe("Multiple criteria fail", () => {
    it("should list all failures when multiple criteria are not met", async () => {
      mockedAxios.post.mockResolvedValue(validAccessTokenResponse);

      mockedAxios.get.mockImplementation(async (url) => {
        if (url.includes("/oauth2/@me")) {
          return {
            data: {
              user: {
                id: createSnowflakeId(100), // Too young
                username: "TestUser",
              },
            },
            status: 200,
          };
        }

        if (url.includes("/users/@me/guilds")) {
          // Too few guilds
          return {
            data: Array.from({ length: 5 }, (_, i) => ({
              id: `guild_${i}`,
              name: `Server ${i}`,
            })),
            status: 200,
          };
        }

        if (url.includes("/connections")) {
          // No verified connections
          return {
            data: [{ type: "steam", name: "testuser", verified: false }],
            status: 200,
          };
        }
      });

      const discord = new DiscordProvider();
      const result = await discord.verify({
        proofs: { code },
      } as unknown as RequestPayload);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(3);
      expect(result.errors).toContain("Discord account must be at least 365 days old (current: 100 days)");
      expect(result.errors).toContain("Must be a member of at least 10 servers (current: 5)");
      expect(result.errors).toContain("Must have at least 2 verified external connections (current: 0)");
    });
  });

  describe("API failures", () => {
    it("should throw error when unable to retrieve auth token", async () => {
      mockedAxios.post.mockResolvedValue({
        status: 500,
      });

      const discord = new DiscordProvider();

      await expect(
        discord.verify({
          proofs: { code },
        } as unknown as RequestPayload)
      ).rejects.toThrow(ProviderExternalVerificationError);
    });

    it("should throw error when user API returns bad status code", async () => {
      mockedAxios.post.mockResolvedValue(validAccessTokenResponse);

      mockedAxios.get.mockImplementation(async (url) => {
        if (url.includes("/oauth2/@me")) {
          return {
            status: 500,
          };
        }
      });

      const discord = new DiscordProvider();

      await expect(
        discord.verify({
          proofs: { code },
        } as unknown as RequestPayload)
      ).rejects.toThrow(ProviderExternalVerificationError);
    });

    it("should return invalid payload when user ID is missing", async () => {
      mockedAxios.post.mockResolvedValue(validAccessTokenResponse);

      mockedAxios.get.mockImplementation(async (url) => {
        if (url.includes("/oauth2/@me")) {
          return {
            data: {
              user: {
                id: undefined,
                username: "TestUser",
              },
            },
            status: 200,
          };
        }
      });

      const discord = new DiscordProvider();
      const result = await discord.verify({
        proofs: { code },
      } as unknown as RequestPayload);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("We were not able to verify a Discord account with your provided credentials.");
    });
  });

  describe("Rate limit handling", () => {
    it("should retry on 429 rate limit and succeed", async () => {
      const testUserId = createSnowflakeId(400);
      mockedAxios.post.mockResolvedValue(validAccessTokenResponse);

      let attemptCount = 0;
      const rateLimitError = {
        response: {
          status: 429,
          headers: { "retry-after": "1" },
        },
        isAxiosError: true,
      };

      // Mock axios.isAxiosError to recognize our mock error
      jest.spyOn(axios, "isAxiosError").mockImplementation((error) => error?.isAxiosError === true);

      mockedAxios.get.mockImplementation(async (url) => {
        if (url.includes("/oauth2/@me")) {
          attemptCount++;
          if (attemptCount === 1) {
            // First attempt - rate limited
            throw rateLimitError;
          }
          // Second attempt - success
          return {
            data: {
              user: {
                id: testUserId,
                username: "TestUser",
              },
            },
            status: 200,
          };
        }

        if (url.includes("/users/@me/guilds")) {
          return {
            data: Array.from({ length: 15 }, (_, i) => ({
              id: `guild_${i}`,
              name: `Server ${i}`,
            })),
            status: 200,
          };
        }

        if (url.includes("/connections")) {
          return {
            data: [
              { type: "github", name: "testuser", verified: true },
              { type: "twitter", name: "testuser", verified: true },
            ],
            status: 200,
          };
        }
      });

      const discord = new DiscordProvider();
      const result = await discord.verify({
        proofs: { code },
      } as unknown as RequestPayload);

      expect(result.valid).toBe(true);
      expect(attemptCount).toBe(2); // Should have retried once
    });
  });
});
