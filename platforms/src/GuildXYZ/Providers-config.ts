import { PlatformSpec, PlatformGroupSpec, Provider } from "../types.js";
import { GuildAdminProvider } from "./Providers/guildXYZ.js";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/guildXYZStampIcon.svg",
  platform: "GuildXYZ",
  name: "Guild.xyz",
  description: "Verify your Guild.xyz community activity",
  connectMessage: "Verify Guilds",
  isEVM: true,
  website: "https://guild.xyz/",
  timeToGet: "10 minutes",
  price: "Free",
  guide: [
    {
      type: "steps",
      items: [
        {
          title: "Step 1",
          description: "Join the Human Passport Guild and obtain at least one role.",
          actions: [
            {
              label: "Join Human Passport Guild",
              href: "https://guild.xyz/humanpassport",
            },
          ],
        },
        {
          title: "Step 2",
          description: `Click "Check Eligibility" below to claim your Guild credentials based on your membership.`,
        },
      ],
    },
    {
      type: "list",
      title: "Important considerations",
      items: [
        "The above is a guide on how to get the Human Passport Guild credential",
        "To receive the Owner or Administrator credential, you must be managing an active Guild",
        "Qualifying owned Guilds must have more than 250 members for the admin credential",
        "You must have at least 1 role in the Human Passport Guild for member credentials",
        "Ensure your wallet is connected to Guild.xyz with the same address used in Passport",
      ],
    },
  ],
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Guild Admin",
    providers: [
      {
        title: "Owner or Administrator of one or more guilds",
        description: "Demonstrate community leadership by owning or administrating guilds with 250+ members",
        name: "GuildAdmin",
      },
    ],
  },
  {
    platformGroup: "Human Passport Guild",
    providers: [
      {
        title: "Member with 1 or more roles in Passport Guild",
        description:
          "Show active participation in the Human Passport community through verified Guild membership and roles",
        name: "GuildPassportMember",
        isDeprecated: true,
      },
    ],
  },
];

export const providers: Provider[] = [new GuildAdminProvider()];
