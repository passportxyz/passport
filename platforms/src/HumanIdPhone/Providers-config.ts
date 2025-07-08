import { PlatformSpec, PlatformGroupSpec, Provider } from "../types.js";
import { HumanIdPhoneProvider } from "./Providers/humanIdPhone.js";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/humanTechIcon.svg",
  platform: "HumanIdPhone",
  name: "Phone Verification",
  description: "Verify your phone number, powered by human.tech",
  connectMessage: "Connect Account",
  website: "https://human-id.org",
  timeToGet: "5 minutes",
  price: "$5",
  guide: [
    {
      type: "steps",
      items: [
        {
          title: "Step 1",
          description: "Navigate to phone verification module.",
          actions: [
            {
              label: "Verify phone number",
              href: "https://silksecure.net/holonym/diff-wallet/phone",
            },
          ],
        },
        {
          title: "Step 2",
          description: "Add phone number to module.",
        },
        {
          title: "Step 3",
          description: "A text will be sent to your phone number that you will use to verify the phone.",
        },
        {
          title: "Step 4",
          description: "Enter the information from your text message into the phone verification module.",
        },
        {
          title: "Step 5",
          description: `Return to Passport and click "Check Eligibility" below to add your Phone Verification Stamp.`,
        },
      ],
    },
  ],
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Phone Verification",
    providers: [
      {
        title: "Verified Phone Number",
        name: "HolonymPhone",
        description: "Confirm ownership of a unique phone number to prove human identity",
      },
    ],
  },
];

export const providers: Provider[] = [new HumanIdPhoneProvider()];
