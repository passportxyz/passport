import { PlatformSpec, PlatformGroupSpec } from "../types";

export const BrightidPlatformDetails: PlatformSpec = {
  icon: "./assets/brightidStampIcon.svg",
  platform: "Brightid",
  name: "BrightID",
  description: "Connect your BrightID",
  connectMessage: "Connect Account",
  isEVM: true,
};

export const BrightidProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Account Name",
    providers: [{ title: "Encrypted", name: "Brightid" }],
  },
];
