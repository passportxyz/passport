import { PlatformSpec, PlatformGroupSpec, Provider } from "../types.js";
import { POAPProvider } from "./Providers/poap.js";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/poapStampIcon.svg",
  platform: "POAP",
  name: "POAP",
  description: "Connect an account to a POAP owned for over 15 days.",
  connectMessage: "Connect to POAP",
  isEVM: true,
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Account Name",
    providers: [{ title: "Connect an account to a POAP owned for over 15 days.", name: "POAP" }],
  },
];

export const providers: Provider[] = [new POAPProvider()];
