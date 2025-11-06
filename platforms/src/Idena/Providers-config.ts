import { PlatformSpec, PlatformGroupSpec, Provider } from "../types.js";
import {
  IdenaStateNewbieProvider,
  IdenaStateVerifiedProvider,
  IdenaStateHumanProvider,
} from "./Providers/IdenaStateProvider.js";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/idenaStampIcon.svg",
  platform: "Idena",
  name: "Idena",
  description: "Prove your unique humanity with Idena",
  connectMessage: "Verify Identity",
  enablePlatformCardUpdate: true,
  website: "https://idena.io/",
  timeToGet: "Up to 2 weeks",
  price: "Free",
  guide: [
    {
      type: "steps",
      items: [
        {
          title: "Step 1",
          description:
            "Create an Idena account at app.idena.io and obtain an invitation code from the Idena community.",
          actions: [
            {
              label: "Join Idena",
              href: "https://app.idena.io",
            },
          ],
        },
        {
          title: "Step 2",
          description: `Participate in validation ceremonies to achieve at least "Newbie" status by solving human-verification puzzles.`,
        },
        {
          title: "Step 3",
          description: `Continue participating in consecutive validation ceremonies to advance your identity state - achieve 75%+ score in three consecutive validations for "Verified" status, or 92%+ score in four consecutive validations for "Human" status.`,
        },
        {
          title: "Step 4",
          description: `Click "Check Eligibility" below to claim your Stamp based on your current identity state.`,
        },
      ],
    },
    {
      type: "list",
      title: "Important considerations",
      items: [
        "Requires participating in timed validation ceremonies with the global Idena network",
        "Validation ceremonies occur at regular intervals - timing is critical",
        "Higher identity states (Verified, Human) require multiple consecutive successful validations",
      ],
    },
  ],
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Identity State",
    providers: [
      {
        title: "Newbie",
        name: "IdenaState#Newbie",
        description:
          "Granted after passing the initial validation, indicating your verification initiation in the Idena system",
        isDeprecated: true,
      },
      {
        title: "Verified",
        name: "IdenaState#Verified",
        description: "Achieved by successfully completing three consecutive validations with a total score >= 75%",
        isDeprecated: true,
      },
      {
        title: "Human",
        name: "IdenaState#Human",
        description: "Earned through four consecutive successful validations and maintaining a total score >= 92%",
        isDeprecated: true,
      },
    ],
  },
];

export const providers: Provider[] = [
  new IdenaStateNewbieProvider(),
  new IdenaStateVerifiedProvider(),
  new IdenaStateHumanProvider(),
];
