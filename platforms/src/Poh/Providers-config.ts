import { PlatformSpec, PlatformGroupSpec } from "../types";

export const PohPlatformDetails: PlatformSpec = {
  icon: "./assets/pohStampIcon.svg",
  platform: "Poh",
  name: "Proof of Humanity",
  description: "Connect your wallet to start the process of verifying with Proof of Humanity.",
  connectMessage: "Connect Account",
  isEVM: true,
};

export const PohProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Account Name",
    providers: [{ title: "Encrypted", name: "Poh" }],
  },
];
