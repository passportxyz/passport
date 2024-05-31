import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { ProofOfPassportProvider } from "./Providers";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/ProofOfPassportStampIcon.svg",
  platform: "ProofOfPassport",
  name: "Proof of Passport",
  description:
    "Scan the NFC chip inside your passport to prove your humanity, powered by ZK for complete anonymity. Open source project.",
  connectMessage: "Connect Account",
  website: "https://proofofpassport.com/",
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Name of the Stamp platform group",
    providers: [
      {
        title: "Prove your humanity with Proof of Passport",
        description: "Powered by ZK cryptography to ensure complete anonymity. Open source project.",
        name: "ProofOfPassport",
      },
    ],
  },
];

export const providers: Provider[] = [new ProofOfPassportProvider()];
