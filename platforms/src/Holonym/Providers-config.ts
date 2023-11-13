import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { HolonymGovIdProvider } from "./Providers/holonymGovIdProvider";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/holonymStampIcon.svg",
  platform: "Holonym",
  name: "Holonym",
  description: "Connect to Holonym to verify your identity without revealing any personal information.",
  connectMessage: "Connect Account",
  isEVM: true,
  website: "https://holonym.id/",
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Government ID",
    providers: [{ title: "Proven uniqueness using Holonym with government ID", name: "HolonymGovIdProvider" }],
  },
];

export const providers: Provider[] = [new HolonymGovIdProvider()];
