import { PlatformSpec, PlatformGroupSpec, Provider } from "../types.js";
import { HumanIdKycProvider } from "./Providers/humanIdKyc.js";
import { requestSBT } from "../HumanID/shared/utils.js";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/idCard.svg",
  platform: "HumanIdKyc",
  name: "Government ID",
  description: "Verify your identity with government ID",
  connectMessage: "Connect Account",
  isEVM: true,
  website: "https://human.tech",
  timeToGet: "10 minutes",
  price: "$5 + gas",
  guide: [
    {
      type: "steps",
      items: [
        {
          title: "Step 1",
          description: "Complete identity verification using your government ID and camera.",
          actions: [
            {
              label: "Verify Identity",
              async onClick({ address, signMessageAsync, sendTransactionAsync, switchChainAsync }): Promise<void> {
                await requestSBT({
                  credentialType: "kyc",
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
          description: "Follow the prompts to photograph your government ID and take a selfie for verification.",
        },
        {
          title: "Step 3",
          description: "Mint the verification token to your wallet (requires $5 for payment and gas fees).",
        },
        {
          title: "Step 4",
          description: `Click "Check Eligibility" to add the Government ID Stamp.`,
        },
      ],
    },
    {
      type: "list",
      title: "Important considerations",
      items: [
        "Requires a camera and valid government ID (passport, driver's license. Other forms of ID are accepted in certain countries)",
        "Stamp auto-renews after 90 days; full reverification required after 1 year",
        "To be eligible, you must mint your SBT on Optimism",
      ],
    },
  ],
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Privacy-Preserving KYC",
    providers: [
      {
        title: "Government ID Holder",
        name: "HolonymGovIdProvider",
        description:
          "Complete identity verification using government-issued ID to prove uniqueness while maintaining privacy",
      },
    ],
  },
];

export const providers: Provider[] = [new HumanIdKycProvider()];
