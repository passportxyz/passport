import { PlatformSpec, PlatformGroupSpec } from "../types";

export const EnsPlatformDetails: PlatformSpec = {
  icon: "./assets/ensStampIcon.svg",
  platform: "Ens",
  name: "ENS",
  description: "Purchase an .eth name to verify/ connect your existing account.",
  connectMessage: "Connect Account",
  isEVM: true,
};

export const EnsProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Account Name",
    providers: [{ title: "Encrypted", name: "Ens" }],
  },
];
