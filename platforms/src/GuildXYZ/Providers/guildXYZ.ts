// ----- Types
import { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import type { Provider } from "../../types";

// ----- Libs
import axios from "axios";

import { getAddress } from "../../utils/signer";

type GuildMembership = {
  guildId: number;
  roleids: number[];
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

const guildBaseEndpoint = "https://api.guild.xyz/v1/";

export async function getGuildMemberships(address: string): Promise<GuildMembership[]> {
  const memberShipResponse: {
    data: GuildMembership[];
  } = await axios.get(`${guildBaseEndpoint}user/membership/${address}`);
  return memberShipResponse.data;
}

export function getGuildMemberCount(guildId: number, allGuilds: Guild[]): number {
  const guild = allGuilds.find((guild) => guild.id === guildId);
  return guild?.memberCount || 0;
}

export async function getAllGuilds(): Promise<Guild[]> {
  // https://api.guild.xyz/v1/guild
  const guildResponse: {
    data: Guild[];
  } = await axios.get(`${guildBaseEndpoint}guild`);
  return guildResponse.data;
}

export async function checkMemberShipCount(memberships: GuildMembership[]): Promise<boolean> {
  // Member of more than 5 guilds and > 15 roles across those guilds (guilds over 250 members)
  const allGuilds = await getAllGuilds();

  const myGuildStats = new Map<number, number>(); // key: guildId, value: roleIdsLength
  memberships.forEach((membership) => {
    myGuildStats.set(membership.guildId, membership.roleids.length);
  });

  // Filter out guilds that don't have sufficient membership and count roles at the same time
  let guildCount = 0;
  let totalRoles = 0;
  for (const guild of allGuilds) {
    if (myGuildStats.has(guild.id) && guild.memberCount > 250) {
      guildCount++;
      totalRoles += myGuildStats.get(guild.id);
    }
  }

  // Check conditions
  return guildCount > 5 && totalRoles > 15;
}

export class GuildMemberProvider implements Provider {
  type = "GuildMember";

  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    try {
      const address = await getAddress(payload);

      const memberships = await getGuildMemberships(address);

      const membershipCount = checkMemberShipCount(memberships);

      return {
        valid: await membershipCount,
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

export class GuildAdminProvider implements Provider {
  type = "GuildAdmin";

  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    try {
      const address = await getAddress(payload);

      const memberships = await getGuildMemberships(address);
      return {
        valid: checkGuildOwner(memberships),
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
