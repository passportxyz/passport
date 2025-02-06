/* eslint-disable */
import { RequestPayload } from "@gitcoin/passport-types";
import {
  GuildAdminProvider,
  GuildPassportMemberProvider,
  PASSPORT_GUILD_ID,
} from "../Providers/guildXYZ.js";

import { createGuildClient } from "@guildxyz/sdk";

const MOCK_ADDRESS = "0xcF314CE817E25b4F784bC1f24c9A79A525fEC50f";

jest.mock("@guildxyz/sdk");

const mockedCreateGuildClient = jest.mocked(createGuildClient);

const mockGuildMemberships = [
  {
    guildId: 1,
    roleIds: [3, 4, 5, 6],
    isAdmin: false,
    isOwner: false,
  },
  {
    guildId: 2,
    roleIds: [3, 4, 5],
    isAdmin: true,
    isOwner: false,
  },
  {
    guildId: 3,
    roleIds: [3, 4, 5],
    isAdmin: false,
    isOwner: true,
  },
];

const mockAllGuilds = [
  {
    id: 1,
    name: "Guild A",
    roles: ["Role 1", "Role 2"],
    imageUrl: "https://example.com/guildA.png",
    urlName: "guild-a",
    memberCount: 300,
  },
  {
    id: 2,
    name: "Guild B",
    roles: ["Role 3", "Role 4", "Role 5"],
    imageUrl: "https://example.com/guildB.png",
    urlName: "guild-b",
    memberCount: 300,
  },
  {
    id: 3,
    name: "Guild C",
    roles: ["Role 6"],
    imageUrl: "https://example.com/guildC.png",
    urlName: "guild-c",
    memberCount: 350,
  },
  {
    id: 4,
    name: "Guild D",
    roles: ["Role 6"],
    imageUrl: "https://example.com/guildC.png",
    urlName: "guild-c",
    memberCount: 100,
  },
];

const mockGuildClientValues = ({ memberships, userGuilds }: any) => {
  mockedCreateGuildClient.mockReturnValue({
    user: {
      getMemberships: jest.fn().mockResolvedValue(memberships),
    },
    guild: {
      getMany: jest.fn().mockResolvedValue(userGuilds),
    },
  } as any);
};

describe("Guild Providers", () => {
  beforeEach(() => {
    mockedCreateGuildClient.mockClear();
  });

  describe("GuildAdminProvider", () => {
    it("valid for Admin of large guild", async () => {
      const provider = new GuildAdminProvider();

      mockGuildClientValues({
        memberships: [
          {
            guildId: 1,
            roleIds: [3, 4, 5, 6],
            isAdmin: true,
            isOwner: false,
          },
        ],
        userGuilds: [
          {
            id: 1,
            memberCount: 300,
          },
        ],
      });

      const result = await provider.verify({ address: MOCK_ADDRESS } as RequestPayload);
      expect(result).toEqual({
        valid: true,
        errors: [],
        record: {
          address: MOCK_ADDRESS,
        },
      });
    });

    it("valid for Owner of large guild", async () => {
      const provider = new GuildAdminProvider();

      mockGuildClientValues({
        memberships: [
          {
            guildId: 1,
            roleIds: [3, 4, 5, 6],
            isAdmin: false,
            isOwner: true,
          },
        ],
        userGuilds: [
          {
            id: 1,
            memberCount: 300,
          },
        ],
      });

      const result = await provider.verify({ address: MOCK_ADDRESS } as RequestPayload);
      expect(result).toEqual({
        valid: true,
        errors: [],
        record: {
          address: MOCK_ADDRESS,
        },
      });
    });

    it("invalid if not admin or owner", async () => {
      const provider = new GuildAdminProvider();

      mockGuildClientValues({
        memberships: [
          {
            guildId: 1,
            roleIds: [3, 4, 5, 6],
            isAdmin: false,
            isOwner: false,
          },
        ],
        userGuilds: [
          {
            id: 1,
            memberCount: 300,
          },
        ],
      });

      const result = await provider.verify({ address: MOCK_ADDRESS } as RequestPayload);
      expect(result).toEqual({
        valid: false,
        errors: ["We did not find any Guilds that you are an admin of with greater than 250 members."],
      });
    });

    it("invalid if admin of small guild", async () => {
      const provider = new GuildAdminProvider();

      mockGuildClientValues({
        memberships: [
          {
            guildId: 1,
            roleIds: [3, 4, 5, 6],
            isAdmin: true,
            isOwner: false,
          },
        ],
        userGuilds: [
          {
            id: 1,
            memberCount: 200,
          },
        ],
      });

      const result = await provider.verify({ address: MOCK_ADDRESS } as RequestPayload);
      expect(result).toEqual({
        valid: false,
        errors: ["We did not find any Guilds that you are an admin of with greater than 250 members."],
      });
    });
  });

  describe("GuildPassportMemberProvider", () => {
    it("valid for user with role in Passport guild", async () => {
      const provider = new GuildPassportMemberProvider();

      mockGuildClientValues({
        memberships: [
          {
            guildId: PASSPORT_GUILD_ID,
            roleIds: [3, 4, 5, 6],
            isAdmin: false,
            isOwner: false,
          },
        ],
        userGuilds: [],
      });

      const result = await provider.verify({ address: MOCK_ADDRESS } as RequestPayload);
      expect(result).toEqual({
        valid: true,
        errors: [],
        record: {
          address: MOCK_ADDRESS,
        },
      });
    });

    it("invalid for user without role in Passport guild", async () => {
      const provider = new GuildPassportMemberProvider();

      mockGuildClientValues({
        memberships: [
          {
            guildId: PASSPORT_GUILD_ID,
            roleIds: [],
            isAdmin: false,
            isOwner: false,
          },
        ],
        userGuilds: [],
      });

      const result = await provider.verify({ address: MOCK_ADDRESS } as RequestPayload);
      expect(result).toEqual({
        valid: false,
        errors: ["You do not hold any roles in the Passport Guild, thus, you do not qualify for this stamp."],
      });
    });

    it("invalid for user with no guild membership", async () => {
      const provider = new GuildPassportMemberProvider();

      mockGuildClientValues({
        memberships: [],
        userGuilds: [],
      });

      const result = await provider.verify({ address: MOCK_ADDRESS } as RequestPayload);
      expect(result).toEqual({
        valid: false,
        errors: ["You do not hold any roles in the Passport Guild, thus, you do not qualify for this stamp."],
      });
    });
  });
});
