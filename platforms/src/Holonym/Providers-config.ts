import { PlatformSpec, PlatformGroupSpec, Provider } from "../types.js";
import { HolonymGovIdProvider } from "./Providers/holonymGovIdProvider.js";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/humanTechIcon.svg",
  platform: "Holonym",
  name: "Holonym",
  description: "Connect to Holonym to verify your identity without revealing any personal information.",
  connectMessage: "Connect Account",
  isEVM: true,
  website: "https://silksecure.net/holonym/diff-wallet",
  timeToGet: "5-10 min",
  price: "$10",
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Holonym KYC",
    providers: [
      { title: "Proven uniqueness using Holonym KYC with government ID or ePassport", name: "HolonymGovIdProvider" },
    ],
  },
];

export const providers: Provider[] = [new HolonymGovIdProvider()];
