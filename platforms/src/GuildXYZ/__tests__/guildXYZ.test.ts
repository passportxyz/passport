/* eslint-disable */
import { RequestPayload } from "@gitcoin/passport-types";
import axios from "axios";
import {
  getGuildMemberships,
  getAllGuilds,
  checkMemberShipCount,
  GuildMemberProvider,
  GuildAdminProvider,
  GuildPassportMemberProvider,
  PASSPORT_GUILD_ID,
} from "../Providers/guildXYZ";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const MOCK_ADDRESS = "0xcF314CE817E25b4F784bC1f24c9A79A525fEC50f";

const mockGuildMemberships = [
  {
    guildId: 1,
    roleids: [1, 2],
    isAdmin: false,
    isOwner: false,
  },
  {
    guildId: 2,
    roleids: [3, 4, 5],
    isAdmin: true,
    isOwner: false,
  },
  {
    guildId: 3,
    roleids: [6],
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
    memberCount: 100,
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
    memberCount: 50,
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

  it("checks membership count correctly", async () => {
    mockedAxios.get.mockResolvedValue({ data: mockAllGuilds });

    const membershipCount = await checkMemberShipCount(mockGuildMemberships);
    expect(membershipCount).toBe(false);
  });

  describe("GuildMemberProvider", () => {
    it("verifies GuildMember correctly", async () => {
      const provider = new GuildMemberProvider();

      mockedAxios.get.mockResolvedValueOnce({
        data: [
          mockGuildMemberships,
          {
            guildId: 4,
            roleids: [6],
            isAdmin: false,
            isOwner: true,
          },
          {
            guildId: 5,
            roleids: [6],
            isAdmin: false,
            isOwner: true,
          },
        ],
      });
      mockedAxios.get.mockResolvedValueOnce({
        data: [
          mockAllGuilds,
          {
            id: 4,
            name: "Guild D",
            roles: ["Role 6"],
            imageUrl: "https://example.com/guildC.png",
            urlName: "guild-c",
            memberCount: 200,
          },
          {
            id: 5,
            name: "Guild E",
            roles: ["Role 6"],
            imageUrl: "https://example.com/guildC.png",
            urlName: "guild-c",
            memberCount: 200,
          },
        ],
      });

      const result = await provider.verify({ address: MOCK_ADDRESS } as RequestPayload);
      expect(result).toEqual({
        valid: false,
        record: {
          address: MOCK_ADDRESS,
        },
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
        record: {
          address: MOCK_ADDRESS,
        },
      });
    });

    it("doesn't verify admin is not admin", async () => {
      const provider = new GuildAdminProvider();

      mockedAxios.get.mockResolvedValueOnce({
        data: [
          {
            guildId: 1,
            roleids: [1, 2],
            isAdmin: false,
            isOwner: false,
          },
        ],
      });

      const result = await provider.verify({ address: MOCK_ADDRESS } as RequestPayload);
      expect(result).toEqual({
        valid: false,
        record: {
          address: MOCK_ADDRESS,
        },
      });
    });

    it("handles errors correctly", async () => {
      const provider = new GuildAdminProvider();

      mockedAxios.get.mockRejectedValueOnce(new Error("Request failed"));

      const result = await provider.verify({ address: MOCK_ADDRESS } as RequestPayload);
      expect(result).toEqual({
        valid: false,
        error: ["Error verifying Guild Admin Membership"],
      });
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
        record: {
          address: MOCK_ADDRESS,
        },
      });
    });

    it("handles errors correctly", async () => {
      const provider = new GuildPassportMemberProvider();

      mockedAxios.get.mockRejectedValueOnce(new Error("Request failed"));

      const result = await provider.verify({ address: MOCK_ADDRESS } as RequestPayload);
      expect(result).toEqual({
        valid: false,
        error: ["Error verifying Guild Passport Membership"],
      });
    });
  });
});
