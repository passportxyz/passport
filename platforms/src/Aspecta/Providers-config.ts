import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { AspectaProvider } from "./Providers/aspecta";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/aspectaLogo.svg",
  platform: "Aspecta",
  name: "Aspecta ID",
  description: "Connect Your Aspecta ID to verify.",
  connectMessage: "Connect Account",
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Account Name",
    providers: [{ title: "Encrypted", name: "Aspecta" }],
  },
];

export const providers: Provider[] = [new AspectaProvider()];
