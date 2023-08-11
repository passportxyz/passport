import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { GrantsStackProvider } from "./Providers/GrantsStack";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/grantsstackStampIcon.svg",
  platform: "GrantsStack",
  name: "GrantsStack",
  description: "Connect your existing GrantsStack Account to verify",
  connectMessage: "Connect Account",
};

export const ProviderConfig: PlatformGroupSpec[] = [
  { platformGroup: "Account Name", providers: [{ title: "GrantsStack", name: "GrantsStack" }] },
];

export const providers: Provider[] = [new GrantsStackProvider()];
