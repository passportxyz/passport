import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { GitPOAPProvider } from "./Providers/gitpoap";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/gitPOAPStampIcon.svg",
  platform: "GitPOAP",
  name: "GitPOAP",
  description: "GitPOAP Verification",
  connectMessage: "Connect Account",
  isEVM: true,
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Account Name",
    providers: [{ title: "Encrypted", name: "GitPOAP" }],
  },
];

export const providers: Provider[] = [new GitPOAPProvider()];
