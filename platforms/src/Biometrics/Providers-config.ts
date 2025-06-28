import { PlatformGroupSpec, PlatformSpec } from "../types.js";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/humanIdStampIcon.svg",
  platform: "Biometrics",
  name: "Biometrics",
  description: "Verify your uniqueness using facial biometrics, powered by human.tech",
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
              href: "https://silksecure.net/holonym/diff-wallet/biometrics",
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
