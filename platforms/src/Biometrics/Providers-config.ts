import { PlatformSpec, PlatformGroupSpec } from "../types.js";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/humanIdStampIcon.svg",
  platform: "Biometrics",
  name: "Biometrics",
  description: "Verify your uniqueness using facial biometrics, powered by human.tech",
  connectMessage: "Verify",
  isEVM: true,
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
