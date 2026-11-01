// ---- Test subject
import { SteamProvider } from "../Providers/steamGamingCredentials.js";
import { RequestPayload } from "@gitcoin/passport-types";
import { ProviderExternalVerificationError } from "../../types.js";

// ----- Libs
import axios from "axios";

jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock environment variable
const originalEnv = process.env;

const MOCK_STEAM_ID = "76561198000000000";
const MOCK_CLAIMED_ID = `https://steamcommunity.com/openid/id/${MOCK_STEAM_ID}`;

function mockOpenIdAssertion(steamId: string): string {
  return new URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "id_res",
    "openid.op_endpoint": "https://steamcommunity.com/openid/login",
    "openid.claimed_id": `https://steamcommunity.com/openid/id/${steamId}`,
    "openid.identity": `https://steamcommunity.com/openid/id/${steamId}`,
    "openid.return_to": "https://passport.human.tech/",
    "openid.response_nonce": "2026-01-01T00:00:00Znonce",
    "openid.assoc_handle": "1234567890",
    "openid.signed": "signed,op_endpoint,claimed_id,identity,return_to,response_nonce,assoc_handle",
    "openid.sig": "dGVzdHNpZ25hdHVyZQ==",
  }).toString();
}

const MOCK_OPENID = mockOpenIdAssertion(MOCK_STEAM_ID);
const validProofs = {
  code: MOCK_CLAIMED_ID,
  openid: MOCK_OPENID,
};

// Mock Steam API responses
const validGamesResponse = {
  data: {
    response: {
      game_count: 5,
      games: [
        {
          appid: 123456,
          name: "Game 1",
          playtime_forever: 12000, // 200 hours
        },
        {
          appid: 234567,
          name: "Game 2",
          playtime_forever: 6000, // 100 hours
        },
        {
          appid: 345678,
          name: "Game 3",
          playtime_forever: 3600, // 60 hours
        },
        {
          appid: 456789,
          name: "Game 4",
          playtime_forever: 1800, // 30 hours
        },
        {
          appid: 567890,
          name: "Game 5",
          playtime_forever: 600, // 10 hours
        },
      ],
    },
  },
  status: 200,
};

const validAchievementsResponse = {
  data: {
    playerstats: {
      achievements: [
        { apiname: "ACHIEVEMENT_1", achieved: 1 },
        { apiname: "ACHIEVEMENT_2", achieved: 1 },
        { apiname: "ACHIEVEMENT_3", achieved: 1 },
        { apiname: "ACHIEVEMENT_4", achieved: 1 },
        { apiname: "ACHIEVEMENT_5", achieved: 1 },
        { apiname: "ACHIEVEMENT_6", achieved: 1 },
        { apiname: "ACHIEVEMENT_7", achieved: 1 },
        { apiname: "ACHIEVEMENT_8", achieved: 1 },
        { apiname: "ACHIEVEMENT_9", achieved: 1 },
        { apiname: "ACHIEVEMENT_10", achieved: 1 },
        { apiname: "ACHIEVEMENT_11", achieved: 1 },
        { apiname: "ACHIEVEMENT_12", achieved: 0 }, // Not unlocked
      ],
    },
  },
  status: 200,
};

const emptyGamesResponse = {
  data: {
    response: {
      game_count: 0,
    },
  },
  status: 200,
};

beforeEach(() => {
  jest.clearAllMocks();
  process.env = {
    ...originalEnv,
    STEAM_API_KEY: "test_api_key",
  };

  mockedAxios.post.mockResolvedValue({
    data: "ns:http://specs.openid.net/auth/2.0\nis_valid:true\n",
    status: 200,
  });

  // Default mock: return valid games response
  mockedAxios.get.mockImplementation(async (url: string) => {
    if (url.includes("GetOwnedGames")) {
      return validGamesResponse;
    }
    if (url.includes("GetUserStatsForGame")) {
      return validAchievementsResponse;
    }
    throw new Error(`Unexpected URL: ${url}`);
  });
});

afterEach(() => {
  process.env = originalEnv;
});

describe("SteamProvider", function () {
  describe("verify", function () {
    it("should return valid when all criteria are met", async () => {
      const provider = new SteamProvider();
      const payload = {
        proofs: {
          ...validProofs,
        },
      } as unknown as RequestPayload;

      const result = await provider.verify(payload);

      expect(result.valid).toBe(true);
      expect(result.record).toBeDefined();
      expect(result.record?.steamId).toBe(MOCK_STEAM_ID);
      expect(result.record?.totalPlaytime).toBeDefined();
      expect(result.record?.achievements).toBeDefined();
      expect(result.record?.gamesOver1Hr).toBeDefined();
      expect(result.record?.mostPlayedPercentage).toBeDefined();
      expect(result.errors).toBeUndefined();
    });

    it("should return invalid when missing OpenID assertion", async () => {
      const provider = new SteamProvider();
      const payload = {
        proofs: {},
      } as unknown as RequestPayload;

      const result = await provider.verify(payload);

      expect(result.valid).toBe(false);
      expect(result.record).toBeUndefined();
      expect(result.errors).toEqual(["Missing Steam OpenID assertion"]);
      expect(mockedAxios.post).not.toHaveBeenCalled();
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it("should return invalid when Steam rejects the OpenID assertion", async () => {
      mockedAxios.post.mockResolvedValue({
        data: "ns:http://specs.openid.net/auth/2.0\nis_valid:false\n",
        status: 200,
      });

      const provider = new SteamProvider();
      const payload = {
        proofs: validProofs,
      } as unknown as RequestPayload;

      const result = await provider.verify(payload);

      expect(result.valid).toBe(false);
      expect(result.record).toBeUndefined();
      expect(result.errors).toEqual(["Steam OpenID assertion could not be verified."]);
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it("should return invalid when claimed_id does not match the verified assertion", async () => {
      const provider = new SteamProvider();
      const payload = {
        proofs: {
          code: "https://steamcommunity.com/openid/id/76561198000000001",
          openid: MOCK_OPENID,
        },
      } as unknown as RequestPayload;

      const result = await provider.verify(payload);

      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(["Steam OpenID claimed_id does not match the verified assertion."]);
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it("should return invalid when claimed_id format is invalid", async () => {
      const provider = new SteamProvider();
      const payload = {
        proofs: {
          openid: "openid.claimed_id=not-a-steam-url&openid.sig=dGVzdA==",
        },
      } as unknown as RequestPayload;

      const result = await provider.verify(payload);

      expect(result.valid).toBe(false);
      expect(result.record).toBeUndefined();
      expect(result.errors).toEqual(["Steam OpenID assertion could not be verified."]);
    });

    it("should return invalid when no games found (private profile)", async () => {
      mockedAxios.get.mockImplementation(async (url: string) => {
        if (url.includes("GetOwnedGames")) {
          return emptyGamesResponse;
        }
        throw new Error(`Unexpected URL: ${url}`);
      });

      const provider = new SteamProvider();
      const payload = {
        proofs: {
          ...validProofs,
        },
      } as unknown as RequestPayload;

      await expect(provider.verify(payload)).rejects.toThrow(ProviderExternalVerificationError);
    });

    it("should return invalid when playtime is less than 100 hours", async () => {
      mockedAxios.get.mockImplementation(async (url: string) => {
        if (url.includes("GetOwnedGames")) {
          return {
            data: {
              response: {
                game_count: 2,
                games: [
                  {
                    appid: 123456,
                    name: "Game 1",
                    playtime_forever: 3000, // 50 hours
                  },
                  {
                    appid: 234567,
                    name: "Game 2",
                    playtime_forever: 1800, // 30 hours
                  },
                ],
              },
            },
            status: 200,
          };
        }
        if (url.includes("GetUserStatsForGame")) {
          return validAchievementsResponse;
        }
        throw new Error(`Unexpected URL: ${url}`);
      });

      const provider = new SteamProvider();
      const payload = {
        proofs: {
          ...validProofs,
        },
      } as unknown as RequestPayload;

      const result = await provider.verify(payload);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.some((e) => e.includes("hours") && e.includes("100"))).toBe(true);
    });

    it("should return invalid when achievements are less than 10", async () => {
      // Mock games with low playtime so we have fewer games to check
      mockedAxios.get.mockImplementation(async (url: string) => {
        if (url.includes("GetOwnedGames")) {
          return {
            data: {
              response: {
                game_count: 2,
                games: [
                  {
                    appid: 123456,
                    name: "Game 1",
                    playtime_forever: 12000, // 200 hours
                  },
                  {
                    appid: 234567,
                    name: "Game 2",
                    playtime_forever: 6000, // 100 hours
                  },
                ],
              },
            },
            status: 200,
          };
        }
        if (url.includes("GetUserStatsForGame")) {
          // Return only 4 achievements total (2 per game = 4 total, which is < 10)
          return {
            data: {
              playerstats: {
                achievements: [
                  { apiname: "ACHIEVEMENT_1", achieved: 1 },
                  { apiname: "ACHIEVEMENT_2", achieved: 1 },
                ],
              },
            },
            status: 200,
          };
        }
        throw new Error(`Unexpected URL: ${url}`);
      });

      const provider = new SteamProvider();
      const payload = {
        proofs: {
          ...validProofs,
        },
      } as unknown as RequestPayload;

      const result = await provider.verify(payload);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.some((e) => e.includes("achievements") && e.includes("10"))).toBe(true);
    });

    it("should return invalid when less than 3 games with >1 hour", async () => {
      mockedAxios.get.mockImplementation(async (url: string) => {
        if (url.includes("GetOwnedGames")) {
          return {
            data: {
              response: {
                game_count: 2,
                games: [
                  {
                    appid: 123456,
                    name: "Game 1",
                    playtime_forever: 12000, // 200 hours
                  },
                  {
                    appid: 234567,
                    name: "Game 2",
                    playtime_forever: 6000, // 100 hours
                  },
                ],
              },
            },
            status: 200,
          };
        }
        if (url.includes("GetUserStatsForGame")) {
          return validAchievementsResponse;
        }
        throw new Error(`Unexpected URL: ${url}`);
      });

      const provider = new SteamProvider();
      const payload = {
        proofs: {
          ...validProofs,
        },
      } as unknown as RequestPayload;

      const result = await provider.verify(payload);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.some((e) => e.includes("games") && e.includes("3"))).toBe(true);
    });

    it("should return invalid when one game is >80% of playtime", async () => {
      mockedAxios.get.mockImplementation(async (url: string) => {
        if (url.includes("GetOwnedGames")) {
          return {
            data: {
              response: {
                game_count: 3,
                games: [
                  {
                    appid: 123456,
                    name: "Game 1",
                    playtime_forever: 10000, // 166.7 hours (83.3% of total)
                  },
                  {
                    appid: 234567,
                    name: "Game 2",
                    playtime_forever: 1000, // 16.7 hours
                  },
                  {
                    appid: 345678,
                    name: "Game 3",
                    playtime_forever: 1000, // 16.7 hours
                  },
                ],
              },
            },
            status: 200,
          };
        }
        if (url.includes("GetUserStatsForGame")) {
          return validAchievementsResponse;
        }
        throw new Error(`Unexpected URL: ${url}`);
      });

      const provider = new SteamProvider();
      const payload = {
        proofs: {
          ...validProofs,
        },
      } as unknown as RequestPayload;

      const result = await provider.verify(payload);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.some((e) => e.includes("80%"))).toBe(true);
    });

    it("should handle API errors gracefully", async () => {
      mockedAxios.get.mockImplementation(async () => {
        throw new Error("Network error");
      });

      const provider = new SteamProvider();
      const payload = {
        proofs: {
          ...validProofs,
        },
      } as unknown as RequestPayload;

      await expect(provider.verify(payload)).rejects.toThrow(ProviderExternalVerificationError);
    });

    it("should handle missing STEAM_API_KEY", async () => {
      process.env.STEAM_API_KEY = undefined;

      const provider = new SteamProvider();
      const payload = {
        proofs: {
          ...validProofs,
        },
      } as unknown as RequestPayload;

      await expect(provider.verify(payload)).rejects.toThrow(ProviderExternalVerificationError);
    });

    it("should handle games without achievements gracefully", async () => {
      mockedAxios.get.mockImplementation(async (url: string) => {
        if (url.includes("GetOwnedGames")) {
          return validGamesResponse;
        }
        if (url.includes("GetUserStatsForGame")) {
          // Some games might not have achievements or stats
          return {
            data: {
              playerstats: {
                achievements: [],
              },
            },
            status: 200,
          };
        }
        throw new Error(`Unexpected URL: ${url}`);
      });

      const provider = new SteamProvider();
      const payload = {
        proofs: {
          ...validProofs,
        },
      } as unknown as RequestPayload;

      const result = await provider.verify(payload);

      // Should still validate playtime and game count, but fail on achievements
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.some((e) => e.includes("achievements"))).toBe(true);
    });
  });
});
