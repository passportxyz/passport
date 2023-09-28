// ----- Types
import { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import type { Provider } from "../../types";

// ----- Libs
import axios from "axios";

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
  const memberShipResponse: {
    data: GuildMembership[];
  } = await axios.get(`${guildBaseEndpoint}user/membership/${address}`);
  return memberShipResponse.data;
}

export async function getAllGuilds(): Promise<Guild[]> {
  // https://api.guild.xyz/v1/guild
  const guildResponse: {
    data: Guild[];
  } = await axios.get(`${guildBaseEndpoint}guild`);

  return guildResponse.data;
}

export async function checkGuildStats(memberships: GuildMembership[]): Promise<GuildStats> {
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
}

class GuildProvider {
  protected async checkMemberShipStats(address: string): Promise<GuildStats> {
    const memberships = await getGuildMemberships(address);
    const stats = await checkGuildStats(memberships);
    return stats;
  }
}

export class GuildMemberProvider extends GuildProvider implements Provider {
  type = "GuildMember";

  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    try {
      const address = await getAddress(payload);

      const membershipStats = await this.checkMemberShipStats(address);

      return {
        valid: membershipStats.guildCount > 5 && membershipStats.totalRoles > 15,
        record: {
          address,
        },
      };
    } catch (e) {
      return {
        valid: false,
        error: ["Error verifying Guild Membership"],
      };
    }
  }
}

export const checkGuildOwner = (memberships: GuildMembership[]): boolean => {
  return memberships.some((membership) => membership.isOwner || membership.isAdmin);
};

export class GuildAdminProvider extends GuildProvider implements Provider {
  type = "GuildAdmin";

  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    try {
      const address = await getAddress(payload);

      const membershipStats = await this.checkMemberShipStats(address);

      return {
        valid: membershipStats.totalAdminOwner > 0,
        record: {
          address,
        },
      };
    } catch (e) {
      return {
        valid: false,
        error: ["Error verifying Guild Admin Membership"],
      };
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
      const address = await getAddress(payload);

      const memberships = await getGuildMemberships(address);

      return {
        valid: checkPassportGuild(memberships),
        record: {
          address,
        },
      };
    } catch (e) {
      return {
        valid: false,
        error: ["Error verifying Guild Passport Membership"],
      };
    }
  }
}
