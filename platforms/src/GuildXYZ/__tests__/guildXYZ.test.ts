/* eslint-disable */
import { RequestPayload } from "@gitcoin/passport-types";
import axios from "axios";
import {
  getGuildMemberships,
  getAllGuilds,
  GuildMemberProvider,
  GuildAdminProvider,
  GuildPassportMemberProvider,
  PASSPORT_GUILD_ID,
  checkGuildStats,
} from "../Providers/guildXYZ";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const MOCK_ADDRESS = "0xcF314CE817E25b4F784bC1f24c9A79A525fEC50f";

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

describe("Guild Providers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches guild memberships correctly", async () => {
    mockedAxios.get.mockResolvedValue({ data: mockGuildMemberships });

    const memberships = await getGuildMemberships(MOCK_ADDRESS);
    expect(memberships).toEqual(mockGuildMemberships);
    expect(mockedAxios.get).toHaveBeenCalledWith(`https://api.guild.xyz/v1/user/membership/${MOCK_ADDRESS}`);
  });

  it("fetches all guilds correctly", async () => {
    mockedAxios.get.mockResolvedValue({ data: mockAllGuilds });

    const allGuilds = await getAllGuilds();
    expect(allGuilds).toEqual(mockAllGuilds);
    expect(mockedAxios.get).toHaveBeenCalledWith("https://api.guild.xyz/v1/guild");
  });

  describe("GuildMemberProvider", () => {
    it("verifies GuildMember correctly", async () => {
      const provider = new GuildMemberProvider();

      mockedAxios.get.mockResolvedValueOnce({
        data: [
          ...mockGuildMemberships,
          {
            guildId: 4,
            roleIds: [6, 7, 8],
            isAdmin: false,
            isOwner: true,
          },
          {
            guildId: 5,
            roleIds: [6, 7],
            isAdmin: false,
            isOwner: true,
          },
          {
            guildId: 6,
            roleIds: [6],
            isAdmin: false,
            isOwner: true,
          },
        ],
      });
      mockedAxios.get.mockResolvedValueOnce({
        data: [
          ...mockAllGuilds,
          {
            id: 4,
            name: "Guild D",
            roles: ["Role 6"],
            imageUrl: "https://example.com/guildC.png",
            urlName: "guild-c",
            memberCount: 300,
          },
          {
            id: 5,
            name: "Guild E",
            roles: ["Role 6"],
            imageUrl: "https://example.com/guildC.png",
            urlName: "guild-c",
            memberCount: 300,
          },
          {
            id: 6,
            name: "Guild F",
            roles: ["Role 6"],
            imageUrl: "https://example.com/guildC.png",
            urlName: "guild-c",
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
    it("should return invalid if has insufficient guilds", async () => {
      const provider = new GuildMemberProvider();

      mockedAxios.get.mockResolvedValueOnce({
        data: mockGuildMemberships,
      });
      mockedAxios.get.mockResolvedValueOnce({
        data: mockAllGuilds,
      });

      const result = await provider.verify({ address: MOCK_ADDRESS } as RequestPayload);
      expect(result).toEqual({
        valid: false,
        errors: [
          "Your Guild membership (> 5) and total roles (> 15) counts are below the required thresholds: Your Guild count: 3, you total roles: &10.",
        ],
        record: undefined,
      });
    });
  });
  describe("GuildAdminProvider", () => {
    it("verifies GuildAdmin correctly", async () => {
      const provider = new GuildAdminProvider();

      mockedAxios.get.mockResolvedValueOnce({ data: mockGuildMemberships });

      const result = await provider.verify({ address: MOCK_ADDRESS } as RequestPayload);
      expect(result).toEqual({
        valid: true,
        errors: [],
        record: {
          address: MOCK_ADDRESS,
        },
      });
    });

    it("should return invalid for non admin", async () => {
      const provider = new GuildAdminProvider();

      mockedAxios.get.mockResolvedValueOnce({
        data: [
          {
            guildId: 1,
            roleIds: [1, 2],
            isAdmin: false,
            isOwner: false,
          },
        ],
      });

      const result = await provider.verify({ address: MOCK_ADDRESS } as RequestPayload);
      expect(result).toEqual({
        valid: false,
        errors: ["We did not find any Guilds that you are an admin of: 0."],
        record: undefined,
      });
    });

    it("handles errors correctly", async () => {
      const provider = new GuildAdminProvider();

      mockedAxios.get.mockRejectedValueOnce(new Error("Request failed"));

      await expect(async () => await provider.verify({ address: MOCK_ADDRESS } as RequestPayload)).rejects.toThrow(
        "Error verifying Guild Admin Membership: {}"
      );
    });
  });

  describe("GuildPassportMemberProvider", () => {
    it("verifies GuildPassportMember correctly", async () => {
      const provider = new GuildPassportMemberProvider();

      mockedAxios.get.mockResolvedValueOnce({
        data: [
          ...mockGuildMemberships,
          {
            guildId: PASSPORT_GUILD_ID,
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

    it("handles errors correctly", async () => {
      const provider = new GuildPassportMemberProvider();

      mockedAxios.get.mockRejectedValueOnce(new Error("Request failed"));

      await expect(async () => await provider.verify({ address: MOCK_ADDRESS } as RequestPayload)).rejects.toThrow(
        "Error verifying Guild Passport Membership: {}"
      );
    });
  });
});

describe("checkGuildStats()", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("computes guild stats correctly", async () => {
    const memberships = [
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

    mockedAxios.get.mockResolvedValue({ data: mockAllGuilds });

    const stats = await checkGuildStats(memberships);

    const expectedResult = {
      guildCount: 3,
      totalRoles: 10,
      totalAdminOwner: 2,
    };

    expect(stats).toEqual(expectedResult);
    expect(mockedAxios.get).toHaveBeenCalledWith("https://api.guild.xyz/v1/guild");
  });

  it("computes guild stats with no qualifying guilds", async () => {
    const memberships = [
      {
        guildId: 4,
        roleIds: [3, 4, 5, 6],
        isAdmin: false,
        isOwner: false,
      },
    ];

    mockedAxios.get.mockResolvedValue({ data: mockAllGuilds });

    const stats = await checkGuildStats(memberships);

    const expectedResult = {
      guildCount: 0,
      totalRoles: 0,
      totalAdminOwner: 0,
    };

    expect(stats).toEqual(expectedResult);
    expect(mockedAxios.get).toHaveBeenCalledWith("https://api.guild.xyz/v1/guild");
  });

  it("handles errors correctly", async () => {
    const memberships = [
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

    mockedAxios.get.mockRejectedValueOnce(new Error("Request failed"));

    await expect(async () => await checkGuildStats(memberships)).rejects.toThrow("Error checking guild stats: {}");
  });
});
