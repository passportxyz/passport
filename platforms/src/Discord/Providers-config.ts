import { PlatformSpec, PlatformGroupSpec, Provider } from "../types.js";
import { DiscordProvider } from "./Providers/discord.js";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/discordStampIcon.svg",
  platform: "Discord",
  name: "Discord",
  description: "Verify that you own a Discord account",
  connectMessage: "Connect Account",
  website: "https://discord.com/",
  timeToGet: "1-2 minutes",
  price: "Free",
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Account Verification",
    providers: [
      {
        title: "Verify Discord Account Ownership",
        description: "Connect and verify ownership of your Discord account",
        name: "Discord",
      },
    ],
  },
];

export const providers: Provider[] = [new DiscordProvider()];
