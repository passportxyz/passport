import { PlatformSpec, PlatformGroupSpec, Provider } from "../types.js";
import { HumanIdPhoneProvider } from "./Providers/humanIdPhone.js";
import { requestSBT } from "../HumanID/shared/utils.js";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/smartphone.svg",
  platform: "HumanIdPhone",
  name: "Phone Verification",
  description: "Verify your phone number",
  connectMessage: "Connect Account",
  isEVM: true,
  website: "https://human.tech",
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
              async onClick({ address, signMessageAsync, sendTransactionAsync, switchChainAsync }): Promise<void> {
                await requestSBT({
                  credentialType: "phone",
                  // We do not pass hasExistingCredential here because if the user already has the SBT,
                  // we want them to see the Human ID modal that tells them they already have the SBT.
                  // hasExistingCredential: () => {},
                  address,
                  signMessageAsync,
                  sendTransactionAsync,
                  switchChainAsync,
                });
              },
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
