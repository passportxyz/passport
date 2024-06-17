// ----- Types
import { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import { ProviderExternalVerificationError, type Provider } from "../../types";
import { createGuildClient, GuildClient } from "@guildxyz/sdk";

// Need to do it like this to support mocking in tests
let guildClient: GuildClient | undefined;
const getGuildClient = () => {
  if (!guildClient || process.env.NODE_ENV === "test") {
    guildClient = createGuildClient("Passport");
  }
  return guildClient;
};

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

type GuildAdminStats = {
  totalAdminOwner: number;
};

const MINIMUM_GUILD_MEMBER_COUNT = 250;

export async function getGuildMemberships(address: string): Promise<GuildMembership[]> {
  // Get current memberships of a user
  return await getGuildClient().user.getMemberships(address);
}

async function getUserGuilds(memberships: GuildMembership[]): Promise<Guild[]> {
  if (memberships.length === 0) {
    return [];
  }
  const userGuildIds = memberships.map((membership) => membership.guildId);
  return getGuildClient().guild.getMany(userGuildIds);
}

export async function checkGuildAdminStats(memberships: GuildMembership[]): Promise<GuildAdminStats> {
  const userGuilds = await getUserGuilds(memberships);
  const userGuildsById = userGuilds.reduce(
    (acc, guild) => {
      acc[guild.id] = guild;
      return acc;
    },
    {} as Record<number, Guild>
  );

  console.log("memberships", memberships);

  const qualifyingMemberships = memberships.filter(
    (membership) =>
      (membership.isAdmin || membership.isOwner) &&
      userGuildsById[membership.guildId].memberCount > MINIMUM_GUILD_MEMBER_COUNT
  );

  // Check conditions
  return {
    totalAdminOwner: qualifyingMemberships.length,
  };
}

export class GuildAdminProvider implements Provider {
  type = "GuildAdmin";

  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    let record = undefined,
      valid = false;
    const errors: string[] = [];
    const address = await getAddress(payload);

    try {
      const memberships = await getGuildMemberships(address);
      const { totalAdminOwner } = await checkGuildAdminStats(memberships);
      valid = totalAdminOwner > 0;

      if (valid) {
        record = {
          address,
        };
      } else {
        errors.push(
          `We did not find any Guilds that you are an admin of with greater than ${MINIMUM_GUILD_MEMBER_COUNT} members.`
        );
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
  const passportMembership = memberships.find((membership) => membership.guildId === PASSPORT_GUILD_ID);
  return Boolean(passportMembership) && passportMembership.roleIds.length > 0;
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
        errors.push("You do not hold any roles in the Passport Guild, thus, you do not qualify for this stamp.");
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
