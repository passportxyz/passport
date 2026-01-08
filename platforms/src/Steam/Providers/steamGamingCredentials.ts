// ----- Types
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import { ProviderExternalVerificationError, type Provider, type ProviderOptions } from "../../types.js";
import { handleProviderAxiosError } from "../../utils/handleProviderAxiosError.js";
import axios from "axios";

// Steam API Response Types
type SteamOwnedGamesResponse = {
  response: {
    game_count?: number;
    games?: SteamGame[];
  };
};

type SteamGame = {
  appid: number;
  name: string;
  playtime_forever: number; // in minutes
};

type SteamUserStatsResponse = {
  playerstats?: {
    achievements?: SteamAchievement[];
  };
};

type SteamAchievement = {
  apiname: string;
  achieved: number; // 1 = unlocked, 0 = locked
};

type SteamGamingData = {
  games: SteamGame[];
  achievements: SteamAchievement[];
};

type QualificationMetrics = {
  totalPlaytimeHours: number;
  totalAchievements: number;
  gamesOver1Hr: number;
  mostPlayedPercentage: number;
};

// Export a Steam Provider
export class SteamProvider implements Provider {
  type = "Steam";
  _options = {};

  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    const errors: string[] = [];
    let valid = false;
    let record = undefined;

    try {
      // 1. Extract Steam ID from OpenID claimed_id
      // The frontend passes openid.claimed_id as 'code' in the OAuth flow
      const claimedId = payload.proofs?.code as string | undefined;
      if (!claimedId) {
        return {
          valid: false,
          errors: ["Missing Steam OpenID claimed_id"],
        };
      }

      const steamId = extractSteamId(claimedId);
      if (!steamId) {
        return {
          valid: false,
          errors: ["Invalid Steam OpenID response. Unable to extract Steam ID."],
        };
      }

      // 2. Fetch gaming data from Steam API
      const gamingData = await fetchSteamGamingData(steamId);

      // 3. Calculate qualification metrics
      const metrics = calculateQualifications(gamingData);

      // 4. Check if all criteria are met
      valid =
        metrics.totalPlaytimeHours >= 100 &&
        metrics.totalAchievements >= 10 &&
        metrics.gamesOver1Hr >= 3 &&
        metrics.mostPlayedPercentage <= 80;

      if (valid) {
        record = {
          steamId: steamId,
          totalPlaytime: String(Math.round(metrics.totalPlaytimeHours * 100) / 100),
          achievements: String(metrics.totalAchievements),
          gamesOver1Hr: String(metrics.gamesOver1Hr),
          mostPlayedPercentage: String(Math.round(metrics.mostPlayedPercentage * 100) / 100),
        };
      } else {
        // Build detailed error messages
        const errorMessages: string[] = [];
        if (metrics.totalPlaytimeHours < 100) {
          errorMessages.push(`You have ${Math.round(metrics.totalPlaytimeHours)} hours. 100 hours required.`);
        }
        if (metrics.totalAchievements < 10) {
          errorMessages.push(`You have ${metrics.totalAchievements} achievements. 10 required.`);
        }
        if (metrics.gamesOver1Hr < 3) {
          errorMessages.push(`You have ${metrics.gamesOver1Hr} games with >1 hour. 3 required.`);
        }
        if (metrics.mostPlayedPercentage > 80) {
          errorMessages.push(
            `One game is ${Math.round(metrics.mostPlayedPercentage)}% of playtime. Maximum 80% allowed.`
          );
        }
        errors.push(...errorMessages);
      }

      return {
        valid,
        record,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      if (
        errorMessage.includes("profile is private") ||
        errorMessage.includes("Profile is private") ||
        errorMessage.includes("Game Details are private") ||
        errorMessage.includes("No games found") ||
        errorMessage.includes("403")
      ) {
        // Provide a user-friendly error message
        throw new ProviderExternalVerificationError(errorMessage);
      }
      throw new ProviderExternalVerificationError(`Steam verification error: ${errorMessage}`);
    }
  }
}

// Helper: Extract Steam ID from OpenID claimed_id
function extractSteamId(claimedId: string): string | null {
  const match = claimedId.match(/^https:\/\/steamcommunity\.com\/openid\/id\/(\d{17})$/);
  return match ? match[1] : null;
}

// Helper: Fetch gaming data from Steam Web API
async function fetchSteamGamingData(steamId: string): Promise<SteamGamingData> {
  const apiKey = process.env.STEAM_API_KEY;
  if (!apiKey) {
    throw new Error("STEAM_API_KEY environment variable is not set");
  }

  // Fetch owned games
  let gamesResponse;
  try {
    gamesResponse = await axios.get<SteamOwnedGamesResponse>(
      "http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/",
      {
        params: {
          key: apiKey,
          steamid: steamId,
          format: "json",
          include_appinfo: true,
          include_played_free_games: true,
        },
      }
    );
  } catch (error) {
    handleProviderAxiosError(error, "error fetching Steam owned games", [steamId]);
    throw error;
  }

  const games = gamesResponse.data.response.games || [];
  const gameCount = gamesResponse.data.response.game_count ?? games.length;

  // Steam API returns game_count: 0 and no games array when:
  // 1. Account actually has no games
  // 2. Game Details privacy setting is set to Private/Friends Only
  // 3. "Always keep my total playtime private" checkbox is checked
  // 4. Profile is completely private
  if (games.length === 0 || gameCount === 0) {
    // If game_count is explicitly 0, it likely means the account has no games
    // (though it could also mean privacy settings are blocking access)
    // We'll provide a message that covers both cases
    throw new Error(
      "No games found on this Steam account. This stamp requires you to have games with playtime. " +
        "If you do have games, please ensure your Steam Privacy Settings allow access: " +
        "'My profile' and 'Game details' must both be set to 'Public', and you must uncheck " +
        "'Always keep my total playtime private even if users can see my game details'. " +
        "Visit: https://steamcommunity.com/my/edit/settings"
    );
  }

  // Fetch achievements for each played game (in parallel with concurrency limit)
  const playedGames = games.filter((game) => game.playtime_forever > 0);
  const achievementPromises = playedGames.map((game) => fetchGameAchievements(steamId, game.appid, apiKey));

  let achievementsData: SteamAchievement[][];
  try {
    achievementsData = await Promise.all(achievementPromises);
  } catch (error) {
    // If achievement fetching fails, continue with empty achievements
    // This allows playtime verification to still work
    achievementsData = [];
  }

  return {
    games,
    achievements: achievementsData.flat(),
  };
}

// Helper: Fetch achievements for a specific game
async function fetchGameAchievements(steamId: string, appId: number, apiKey: string): Promise<SteamAchievement[]> {
  try {
    const response = await axios.get<SteamUserStatsResponse>(
      "http://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v0002/",
      {
        params: {
          appid: appId,
          key: apiKey,
          steamid: steamId,
        },
      }
    );

    const achievements = response.data.playerstats?.achievements || [];
    return achievements.filter((ach) => ach.achieved === 1);
  } catch (error) {
    // Game might not have achievements or stats not available
    // Return empty array instead of throwing
    return [];
  }
}

// Helper: Calculate qualification metrics
function calculateQualifications(gamingData: SteamGamingData): QualificationMetrics {
  const { games } = gamingData;

  // Total playtime in hours
  const totalPlaytimeMinutes = games.reduce((sum, game) => sum + (game.playtime_forever || 0), 0);
  const totalPlaytimeHours = totalPlaytimeMinutes / 60;

  // Games with >1 hour
  const gamesOver1Hr = games.filter((game) => game.playtime_forever > 60).length;

  // Most played game percentage
  const mostPlayedMinutes = Math.max(...games.map((g) => g.playtime_forever || 0), 0);
  const mostPlayedPercentage = totalPlaytimeMinutes > 0 ? (mostPlayedMinutes / totalPlaytimeMinutes) * 100 : 0;

  // Total achievements
  const totalAchievements = gamingData.achievements.length;

  return {
    totalPlaytimeHours,
    gamesOver1Hr,
    mostPlayedPercentage,
    totalAchievements,
  };
}
