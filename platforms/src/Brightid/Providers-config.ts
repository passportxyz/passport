import { PlatformSpec, PlatformGroupSpec, Provider } from "../types.js";
import { BrightIdProvider } from "./Providers/brightid.js";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/brightidStampIcon.svg",
  platform: "Brightid",
  name: "BrightID",
  description: "Verify identity with BrightID social verification",
  connectMessage: "Connect Account",
  website: "https://brightid.org/",
  timeToGet: "2-3 hours",
  price: "Free",
  guide: [
    {
      type: "steps",
      items: [
        {
          title: "Step 1",
          description: "Create a BrightID account and download the mobile app.",
          actions: [
            {
              label: "Get BrightID",
              href: "https://www.brightid.org/",
            },
          ],
        },
        {
          title: "Step 2",
          description:
            "Attend a BrightID connection party to receive 'meets' verification by showing yourself clearly on video and responding to verification requirements.",
          actions: [
            {
              label: "Find Connection Party",
              href: "https://meet.brightid.org/#/",
            },
          ],
        },
        {
          title: "Step 3",
          description: "Scan the QR code displayed in Passport using your BrightID mobile app to link your account.",
        },
        {
          title: "Step 4",
          description: `Click "Check Eligibility" below to verify your BrightID connection and claim your stamp.`,
        },
      ],
    },
    {
      type: "list",
      title: "Important considerations",
      items: [
        "Requires attending live connection parties for verification",
        "Must receive 'meets' verification status before connecting to Passport",
        "Uses QR code scanning to link mobile app with Passport",
        "Time estimate includes verification process at connection parties",
      ],
    },
  ],
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Community Verification",
    providers: [
      {
        title: "Peer-Verified Identity",
        name: "Brightid",
        description: "Validated as unique human through community-based social verification",
        isDeprecated: true,
      },
    ],
  },
];

export const providers: Provider[] = [new BrightIdProvider()];
