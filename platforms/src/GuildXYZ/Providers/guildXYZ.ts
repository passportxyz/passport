// ----- Types
import { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import { ProviderExternalVerificationError, type Provider } from "../../types";

// ----- Libs
import axios from "axios";

// ----- Utils
import { handleProviderAxiosError } from "../../utils/handleProviderAxiosError";

import { getAddress } from "../../utils/signer";

type GuildMembership = {
  guildId: number;
  roleIds: number[];
  isAdmin: boolean;
  isOwner: boolean;
};

type Guild = {
  id: number;
  name: string;
  roles: string[]; // names of the roles
  imageUrl: string;
  urlName: string;
  memberCount: number;
};

type GuildStats = {
  guildCount: number;
  totalRoles: number;
  totalAdminOwner: number;
};

const guildBaseEndpoint = "https://api.guild.xyz/v1/";

export async function getGuildMemberships(address: string): Promise<GuildMembership[]> {
  try {
    const memberShipResponse: {
      data: GuildMembership[];
    } = await axios.get(`${guildBaseEndpoint}user/membership/${address}`);
    return memberShipResponse.data;
  } catch (error: unknown) {
    handleProviderAxiosError(error, "get guild memberships", [address]);
  }
}

export async function getAllGuilds(): Promise<Guild[]> {
  try {
    // https://api.guild.xyz/v1/guild
    const guildResponse: {
      data: Guild[];
    } = await axios.get(`${guildBaseEndpoint}guild`);

    return guildResponse.data;
  } catch (error) {
    handleProviderAxiosError(error, "get all guilds");
  }
}

export async function checkGuildStats(memberships: GuildMembership[]): Promise<GuildStats> {
  try {
    // Member of more than 5 guilds and > 15 roles across those guilds (guilds over 250 members)
    const allGuilds = await getAllGuilds();

    const myGuildRoles = new Map<number, number>(); // key: guildId, value: roleIdsLength
    const adminOwnerGuilds = new Map<number, number>();
    memberships.forEach((membership) => {
      myGuildRoles.set(membership.guildId, membership.roleIds.length);
      adminOwnerGuilds.set(membership.guildId, membership.isAdmin || membership.isOwner ? 1 : 0);
    });

    // Aggregate guild and role count
    let guildCount = 0;
    let totalRoles = 0;
    let totalAdminOwner = 0;

    for (const guild of allGuilds) {
      if (myGuildRoles.has(guild.id) && guild.memberCount > 250) {
        guildCount++;
        totalRoles += myGuildRoles.get(guild.id);
        totalAdminOwner += adminOwnerGuilds.get(guild.id);
      }
    }

    // Check conditions
    return {
      guildCount,
      totalRoles,
      totalAdminOwner,
    };
  } catch (error: unknown) {
    throw new ProviderExternalVerificationError(`Error checking guild stats: ${JSON.stringify(error)}`);
  }
}

class GuildProvider {
  protected async checkMemberShipStats(address: string): Promise<GuildStats> {
    const memberships = await getGuildMemberships(address);
    const stats = await checkGuildStats(memberships);
    return stats;
  }
}

export const checkGuildOwner = (memberships: GuildMembership[]): boolean => {
  return memberships.some((membership) => membership.isOwner || membership.isAdmin);
};

export class GuildAdminProvider extends GuildProvider implements Provider {
  type = "GuildAdmin";

  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    try {
      let valid = false,
        record = undefined,
        membershipStats;
      const errors: string[] = [];
      const address = await getAddress(payload);
      try {
        membershipStats = await this.checkMemberShipStats(address);
      } catch (error) {
        errors.push(String(error));
      }

      valid = membershipStats.totalAdminOwner > 0;

      if (valid) {
        record = {
          address,
        };
      } else {
        errors.push(`We did not find any Guilds that you are an admin of: ${membershipStats.totalAdminOwner}.`);
      }

      return {
        valid,
        record,
        errors,
      };
    } catch (e: unknown) {
      throw new ProviderExternalVerificationError(`Error verifying Guild Admin Membership: ${JSON.stringify(e)}`);
    }
  }
}

export const PASSPORT_GUILD_ID = 19282;

const checkPassportGuild = (memberships: GuildMembership[]): boolean => {
  return memberships.some((membership) => membership.guildId === PASSPORT_GUILD_ID);
};

export class GuildPassportMemberProvider implements Provider {
  type = "GuildPassportMember";

  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    try {
      const errors: string[] = [];
      let valid = false,
        record = undefined,
        memberships;
      const address = await getAddress(payload);

      try {
        memberships = await getGuildMemberships(address);
      } catch (error: unknown) {
        errors.push(String(error));
      }

      valid = checkPassportGuild(memberships);
      if (valid) {
        record = {
          address,
        };
      } else {
        errors.push("You are not a member of the Passport Guild, thus, you do not qualify for this stamp.");
      }

      return {
        valid,
        record,
        errors,
      };
    } catch (e: unknown) {
      throw new ProviderExternalVerificationError(`Error verifying Guild Passport Membership: ${JSON.stringify(e)}.`);
    }
  }
}
