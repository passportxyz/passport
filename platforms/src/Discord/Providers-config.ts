import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { DiscordProvider } from "./Providers/discord";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/discordStampIcon.svg",
  platform: "Discord",
  name: "Discord",
  description: "Connect your existing Discord account to verify.",
  connectMessage: "Connect Account",
  website: "https://discord.com",
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Account Name",
    providers: [{ title: "Encrypted", name: "Discord" }],
  },
];

export const providers: Provider[] = [new DiscordProvider()];
