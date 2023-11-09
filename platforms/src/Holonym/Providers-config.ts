import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { HolonymGovIdProvider } from "./Providers/holonymGovIdProvider";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/holonymStampIcon.svg",
  platform: "Holonym",
  name: "Holonym",
  description:
    "To verify your Holo, mint your Holo at app.holonym.id and then prove uniqueness at app.holonym.id/prove/uniqueness",
  connectMessage: "Connect Account",
  isEVM: true,
  website: "https://www.holonym.id",
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Government ID",
    providers: [{ title: "Proven uniqueness using Holonym with government ID", name: "HolonymGovIdProvider" }],
  },
];

export const providers: Provider[] = [new HolonymGovIdProvider()];
