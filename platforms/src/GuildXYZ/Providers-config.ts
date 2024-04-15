import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { GuildAdminProvider, GuildPassportMemberProvider } from "./Providers/guildXYZ";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/guildXYZStampIcon.svg",
  platform: "GuildXYZ",
  name: "Guild Membership and Roles",
  description: "Connect to Guild to verify your membership in open source communities.",
  connectMessage: "Verify Guilds",
  isEVM: true,
  website: "https://guild.xyz/",
};

export const ProviderConfig: PlatformGroupSpec[] = [
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

export const providers: Provider[] = [new GuildAdminProvider(), new GuildPassportMemberProvider()];
