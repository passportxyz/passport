import { PlatformSpec, PlatformGroupSpec } from "../types";

export const GuildXYZPlatformDetails: PlatformSpec = {
  icon: "./assets/guildXYZStampIcon.svg",
  platform: "GuildXYZ",
  name: "Guild Membership and Roles",
  description: "Connect your Guild XYZ account to verify your memberships.",
  connectMessage: "Verify Guilds",
  isEVM: true,
};

export const GuildXYZProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Guild Member",
    providers: [
      {
        title: "Member of more than 5 guilds and more than 15 roles*",
        name: "GuildMember",
      },
    ],
  },
  {
    platformGroup: "Guild Admin",
    providers: [
      {
        title: "Owner or Administrator of one or more guilds*",
        name: "GuildAdmin",
      },
    ],
  },
  {
    platformGroup: "Guild Passport Member",
    providers: [{ title: "Member with 1 or more roles in Gitcoin Passport Guild", name: "GuildPassportMember" }],
  },
];

// TODO: allow adding additional content to the side panel: Stake your GTC on the new Identity Staking site.
