import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { GuildMemberProvider, GuildAdminProvider, GuildPassportMemberProvider } from "./Providers/guildXYZ";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/guildXYZStampIcon.svg",
  platform: "GuildXYZ",
  name: "Guild Membership and Roles",
  description: "Connect your Guild XYZ account to verify your memberships.",
  connectMessage: "Verify Guilds",
  isEVM: true,
  website: "https://guild.xyz",
};

export const ProviderConfig: PlatformGroupSpec[] = [
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

export const providers: Provider[] = [
  new GuildAdminProvider(),
  new GuildMemberProvider(),
  new GuildPassportMemberProvider(),
];
