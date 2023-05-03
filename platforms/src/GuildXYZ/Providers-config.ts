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
    platformGroup: "Guild Membership and Roles",
    providers: [
      {
        title: "Member of more than 5 guilds and > 15 roles across those guilds (guilds over 250 members)",
        name: "GuildMember",
      },
      {
        title: "Owner (Guild Master) or Administrator (Guild Admin) of one or more guilds (over 500 members)",
        name: "GuildAdmin",
      },
      { title: "Member with 1 or more roles in Passport Guild", name: "GuildPassportMember" },
    ],
  },
];

// TODO: allow adding additional content to the side panel: Stake your GTC on the new Identity Staking site.
