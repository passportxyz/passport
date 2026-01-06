import { PlatformSpec, PlatformGroupSpec, Provider } from "../types.js";
import { DiscordProvider } from "./Providers/discord.js";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/discordStampIcon.svg",
  platform: "Discord",
  name: "Discord",
  description: "Verify genuine Discord engagement and Sybil resistance",
  connectMessage: "Connect Account",
  website: "https://discord.com/",
  timeToGet: "1-2 minutes",
  price: "Free",
  guide: [
    {
      type: "steps",
      items: [
        {
          title: "Step 1",
          description:
            "Connect your Discord account. You'll be asked to authorize access to your server memberships and verified connections.",
        },
        {
          title: "Step 2",
          description:
            "Your account will be verified against three criteria: account age (365+ days), server membership (10+ servers), and verified connections (2+ external accounts).",
        },
      ],
    },
    {
      type: "list",
      title: "Requirements",
      items: [
        "Discord account must be at least 365 days old",
        "Must be a member of 10 or more servers",
        "Must have 2 or more verified external connections (Twitter, GitHub, Steam, etc.)",
      ],
    },
  ],
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Account Verification",
    providers: [
      {
        title: "Discord Engagement Verification",
        description: "Verify account age, server participation, and cross-platform connections",
        name: "Discord",
      },
    ],
  },
];

export const providers: Provider[] = [new DiscordProvider()];
