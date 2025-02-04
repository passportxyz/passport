import { PlatformSpec, PlatformGroupSpec, Provider } from "../types.js";
import { OutdidProvider } from "./Providers/outdid.js";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/outdidStampIcon.svg",
  platform: "Outdid",
  name: "Outdid",
  description: "Outdid's free ZK ID verification brings a strong sybil signal with complete privacy and anonymity.",
  connectMessage: "Connect Account",
  website: "https://outdid.io/",
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "ZK Passport",
    providers: [
      {
        title: "ZK-prove your identity with Outdid",
        description:
          "Outdid uses zero-knowledge cryptography to ensure you are a unique human without revealing any personal information.",
        name: "Outdid",
        isDeprecated: true,
      },
    ],
  },
];

export const providers: Provider[] = [new OutdidProvider()];
