// ----- Types
import { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import { ProviderExternalVerificationError, type Provider } from "../../types";
import { createGuildClient } from "@guildxyz/sdk";

// The only parameter is the name of your project
const guildClient = createGuildClient("Passport");

import { getAddress } from "../../utils/signer";

type GuildMembership = {
  guildId: number;
  roleIds: number[];
  isAdmin: boolean;
  isOwner: boolean;
};

type Guild = {
  id: number;
  memberCount: number;
};

type GuildStats = {
  guildCount: number;
  totalRoles: number;
  totalAdminOwner: number;
};

export async function getGuildMemberships(address: string): Promise<GuildMembership[]> {
  // Get current memberships of a user
  return await guildClient.user.getMemberships(address);
}

async function getUserGuilds(memberships: GuildMembership[]): Promise<Guild[]> {
  const userGuildIds = memberships.map((membership) => membership.guildId);
  return guildClient.guild.getMany(userGuildIds);
}

export async function checkGuildStats(memberships: GuildMembership[]): Promise<GuildStats> {
  try {
    // Member of more than 5 guilds and > 15 roles across those guilds (guilds over 250 members)

    const myGuildRoles = new Map<number, number>(); // key: guildId, value: roleIdsLength
    const adminOwnerGuilds = new Map<number, number>();
    memberships.forEach((membership) => {
      myGuildRoles.set(membership.guildId, membership.roleIds.length);
      adminOwnerGuilds.set(membership.guildId, membership.isAdmin || membership.isOwner ? 1 : 0);
    });

    const userGuilds = await getUserGuilds(memberships);

    // Aggregate guild and role count
    let guildCount = 0;
    let totalRoles = 0;
    let totalAdminOwner = 0;

    for (const guild of userGuilds) {
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
    let record = undefined,
      valid = false;
    const errors: string[] = [];
    const address = await getAddress(payload);

    try {
      const membershipStats = await this.checkMemberShipStats(address);
      valid = membershipStats.totalAdminOwner > 0;

      if (valid) {
        record = {
          address,
        };
      } else {
        errors.push("We did not find any Guilds that you are an admin of.");
      }
    } catch (error: unknown) {
      if ((error as Error)?.message?.includes("User not found")) {
        errors.push("Unable to find user in the Guild system. Please join a Guild first.");
      } else {
        throw error;
      }
    }

    return {
      valid,
      record,
      errors,
    };
  }
}

export const PASSPORT_GUILD_ID = 19282;

const checkPassportGuild = (memberships: GuildMembership[]): boolean => {
  return memberships.some((membership) => membership.guildId === PASSPORT_GUILD_ID);
};

export class GuildPassportMemberProvider implements Provider {
  type = "GuildPassportMember";

  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    const errors: string[] = [];
    let valid = false;

    let record = undefined;
    const address = await getAddress(payload);

    try {
      const memberships = await getGuildMemberships(address);
      valid = checkPassportGuild(memberships);

      if (valid) {
        record = {
          address,
        };
      } else {
        errors.push("You are not a member of the Passport Guild, thus, you do not qualify for this stamp.");
      }
    } catch (error: unknown) {
      if ((error as Error)?.message?.includes("User not found")) {
        errors.push("Unable to find user in the Guild system. Please join a Guild first.");
      } else {
        throw error;
      }
    }

    return {
      valid,
      record,
      errors,
    };
  }
}
