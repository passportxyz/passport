import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { AlloProvider } from "./Providers/Allo";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/alloStampIcon.svg",
  platform: "Allo",
  name: "Allo",
  description: "Connect your existing Allo Account to verify",
  connectMessage: "Connect Account",
};

export const ProviderConfig: PlatformGroupSpec[] = [
  { platformGroup: "Account Name", providers: [{ title: "Allo", name: "Allo" }] },
];

export const providers: Provider[] = [new AlloProvider()];
