import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { BrightIdProvider } from "./Providers/brightid";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/brightidStampIcon.svg",
  platform: "Brightid",
  name: "BrightID",
  description: "Connect your BrightID",
  connectMessage: "Connect Account",
  isEVM: true,
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Account Name",
    providers: [{ title: "Encrypted", name: "Brightid" }],
  },
];

export const providers: Provider[] = [new BrightIdProvider()];
