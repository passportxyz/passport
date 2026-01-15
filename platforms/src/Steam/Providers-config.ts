import { PlatformSpec, PlatformGroupSpec, Provider } from "../types.js";
import { SteamProvider } from "./Providers/steamGamingCredentials.js";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/steamStampIcon.svg",
  platform: "Steam",
  name: "Steam",
  description: "Verify your Steam gaming credentials and activity",
  connectMessage: "Check Eligibility",
  website: "https://steamcommunity.com/",
  timeToGet: "2-3 minutes",
  price: "Free",
  guide: [
    {
      type: "steps",
      items: [
        {
          title: "Step 1",
          description: "Ensure your Steam Profile and Game Details are both set to Public in Privacy Settings.",
          actions: [
            {
              label: "Steam Privacy Settings",
              href: "https://steamcommunity.com/my/edit/settings",
            },
          ],
        },
        {
          title: "Step 2",
          description: "Click 'Check Eligibility' to connect and verify your Steam account.",
        },
        {
          title: "Step 3",
          description: "Your gaming activity will be automatically verified against qualification criteria.",
        },
      ],
    },
    {
      type: "list",
      title: "Important considerations",
      items: [
        "Both your Steam Profile and Game Details must be set to Public for verification to work",
        "Verification checks your total playtime, achievements, and game diversity",
        "You must meet ALL four criteria to receive this stamp",
        "Private profiles or profiles without sufficient gaming history will not qualify",
        "Your privacy settings can be changed back to private after verification is complete",
      ],
    },
  ],
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Gaming Credentials",
    providers: [
      {
        title: "Verify Steam Gaming Credentials",
        description:
          "Connect your Steam account and verify gaming activity meets qualification criteria: 100+ hours playtime, 10+ achievements, 3+ games with >1 hour each, and no more than 80% playtime in a single game.",
        name: "Steam",
      },
    ],
  },
];

export const providers: Provider[] = [new SteamProvider()];
