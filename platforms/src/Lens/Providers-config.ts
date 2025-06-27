import { PlatformSpec, PlatformGroupSpec, Provider } from "../types.js";
import { LensProfileProvider } from "./Providers/lens.js";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/lensStampIcon.svg",
  platform: "Lens",
  name: "Lens",
  description: "Verify your Lens Handle ownership",
  connectMessage: "Verify Account",
  isEVM: true,
  website: "https://lens.xyz/",
  timeToGet: "5-10 minutes",
  price: "Variable",
  guide: [
    {
      type: "steps",
      items: [
        {
          title: "Step 1",
          description: "Obtain a Lens Handle through the official claim portal or purchase from NFT marketplaces.",
          actions: [
            {
              label: "Get Lens Handle",
              href: "https://onboarding.lens.xyz/",
            },
          ],
        },
        {
          title: "Step 2",
          description: "Connect your Ethereum account containing the Lens Handle to your Passport.",
        },
        {
          title: "Step 3",
          description: `Click "Check Eligibility" below to verify your Lens Handle ownership.`,
        },
      ],
    },
    {
      type: "list",
      title: "Important considerations",
      items: [
        "Only Lens Handles are verified, not Lens Profiles",
        "Handles can be claimed through Lens beta or purchased on NFT marketplaces",
        "Verification may be delayed after claiming a new Handle",
      ],
    },
  ],
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Social Verification",
    providers: [
      {
        title: "Lens Handle Owner",
        description: "Acquired and verified ownership of Lens Handle for decentralized social media participation",
        name: "Lens",
      },
    ],
  },
];

export const providers: Provider[] = [new LensProfileProvider()];
