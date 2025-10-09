import { requestSBT } from "../HumanID/shared/utils.js";
import { PlatformGroupSpec, PlatformSpec } from "../types.js";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/biometrics.svg",
  platform: "Biometrics",
  name: "Biometrics",
  description: "Verify your uniqueness using facial biometrics",
  connectMessage: "Verify",
  isEVM: true,
  timeToGet: "5 minutes",
  price: "$5 + gas",
  guide: [
    {
      type: "steps",
      items: [
        {
          title: "Step 1",
          description: "Complete biometric verification using your smartphone camera for 3D facial liveness detection.",
          actions: [
            {
              label: "Start Biometric Scan",
              // Oct 9, 2025: We are temporarily having users open a new tab because FaceTec initialization is failing in iframe
              href: "https://id.human.tech/biometrics",
              // async onClick({ address, signMessageAsync, sendTransactionAsync, switchChainAsync }): Promise<void> {
              //   await requestSBT({
              //     credentialType: "biometrics",
              //     // We do not pass hasExistingCredential here because if the user already has the SBT,
              //     // we want them to see the Human ID modal that tells them they already have the SBT.
              //     // hasExistingCredential: () => {},
              //     address,
              //     signMessageAsync,
              //     sendTransactionAsync,
              //     switchChainAsync,
              //   });
              // },
            },
          ],
        },
        {
          title: "Step 2",
          description:
            "Follow the prompts to position your face and complete the liveness check to prove you're a real person.",
        },
        {
          title: "Step 3",
          description:
            "System performs deduplication check to ensure your biometric signature is unique in the database.",
        },
        {
          title: "Step 4",
          description: `Click "Check Eligibility" below to add your Biometrics Stamp once verification is complete.`,
        },
      ],
    },
    {
      type: "list",
      title: "Important considerations",
      items: [
        "Requires front-facing camera",
        "Uses 3D liveness detection to prevent spoofing attempts",
        "Biometric data is processed securely and not stored in raw form",
      ],
    },
  ],
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Biometric Verification",
    providers: [
      {
        title: "Unique Biometric Identity",
        name: "Biometrics",
        description: "Proves unique humanity through 3D facial liveness verification and deduplication technology",
      },
    ],
  },
];

export { providers } from "./Providers/index.js";
