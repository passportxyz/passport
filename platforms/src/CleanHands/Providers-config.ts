import { PlatformSpec, PlatformGroupSpec, Provider } from "../types.js";
import { ClanHandsProvider } from "./Providers/index.js";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/proofOfCleanHandsBlack.svg",
  platform: "CleanHands",
  name: "Clean Hands",
  description: "Privately prove you are not sanctioned using Proof of Clean Hands",
  connectMessage: "Verify Account",
  isEVM: true,
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Proof of Clean Hands",
    providers: [
      {
        title: "Sanctions-Free Identity Verified",
        description: "Awarded after completing Holonym KYC and sanctions validation, strengthening your humanity proof",
        name: "CleanHands",
      },
    ],
  },
];

export const providers: Provider[] = [new ClanHandsProvider()];
