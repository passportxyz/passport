import { PlatformSpec, PlatformGroupSpec, Provider } from "../types.js";
import { CleanHandsProvider } from "./Providers/index.js";
import { requestSBT } from "../HumanID/shared/utils.js";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/cleanHands.svg",
  platform: "CleanHands",
  name: "Proof of Clean Hands",
  description: "Verify clean regulatory status",
  connectMessage: "Verify Account",
  isEVM: true,
  timeToGet: "10 minutes",
  price: "$5 + gas fees",
  guide: [
    {
      type: "steps",
      items: [
        {
          title: "Step 1",
          description: "Navigate to Proof of Clean Hands verification module.",
          actions: [
            {
              label: "Verify Clean Hands",
              async onClick({ address, signMessageAsync, sendTransactionAsync, switchChainAsync }): Promise<void> {
                await requestSBT({
                  credentialType: "clean-hands",
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
          description: "Follow prompts to verify your government ID and complete liveness check to prove identity.",
        },
        {
          title: "Step 3",
          description: "Generate proof that you are not on sanctions lists or politically exposed person lists.",
        },
        {
          title: "Step 4",
          description: "Mint the verification token to your wallet (requires $5 for payment and gas fees).",
        },
        {
          title: "Step 5",
          description: `Return to Passport and click "Check Eligibility" below to add your Proof of Clean Hands Stamp.`,
        },
      ],
    },
    {
      type: "list",
      title: "Important considerations",
      items: [
        "Requires government ID verification",
        "To be eligible, you must mint your SBT on Optimism",
        "Stamp auto-renews after 90 days; full reverification required after 1 year",
        "Some countries excluded from verification process",
      ],
    },
  ],
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Proof of Clean Hands",
    providers: [
      {
        title: "Sanctions-Free Identity Verified",
        description:
          "Awarded after completing identity verification and sanctions validation, strengthening your humanity proof",
        name: "CleanHands",
      },
    ],
  },
];

export const providers: Provider[] = [new CleanHandsProvider()];
