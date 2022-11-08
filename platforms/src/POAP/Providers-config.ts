import { PlatformSpec, PlatformGroupSpec } from "../types";

export const POAPPlatformDetails: PlatformSpec = {
  icon: "./assets/poapStampIcon.svg",
  platform: "POAP",
  name: "POAP",
  description: "Connect an account to a POAP owned for over 15 days.",
  connectMessage: "Connect to POAP",
  isEVM: true,
};

export const POAPProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Account Name",
    providers: [{ title: "Connect an account to a POAP owned for over 15 days.", name: "POAP" }],
  },
];
