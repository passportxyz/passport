import { PlatformSpec, PlatformGroupSpec, Provider } from "../types.js";
import { HumanIdPhoneProvider } from "./Providers/humanIdPhone.js";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/humanIdStampIcon.svg",
  platform: "HumanIdPhone",
  name: "Human ID Phone",
  description: "Verify your phone number privately with Human ID",
  connectMessage: "Connect your wallet to verify your phone number",
  website: "https://human-id.org",
  guide: [
    {
      type: "steps",
      items: [
        {
          title: "Visit the HumanID verification page",
          description: "Navigate to the HumanID Phone verification page to begin the process.",
          actions: [
            {
              label: "Go to HumanID Phone Verification",
              href: "https://human-id.org/verify",
            },
          ],
        },
        {
          title: "Enter your phone number",
          description:
            "Provide your phone number to receive a verification code. Your number will be hashed and not stored.",
          image: {
            src: "./assets/humanIdCredentialLoading.png",
            alt: "Phone number entry interface",
          },
        },
        {
          title: "Complete SMS verification",
          description: "Enter the verification code sent to your phone. This proves ownership of the phone number.",
          actions: [
            {
              label: "Learn about privacy protection",
              href: "/help/humanid-privacy",
            },
          ],
        },
        {
          title: "Return to Passport",
          description: "After successful verification, return to Passport and click 'Verify' to claim your stamp.",
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
        title: "Phone SBT",
        name: "HumanIdPhone",
        description: "Proves you have verified your phone number through Human ID",
      },
    ],
  },
];

export const providers: Provider[] = [new HumanIdPhoneProvider()];
