import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { AllowListProvider } from "./Providers";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/passportLogoWhite.svg",
  platform: "AllowList",
  name: "AllowList",
  description: "Verify you are part of a community",
  connectMessage: "Verify",
  isEVM: true,
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Custom Allow List",
    providers: [
      {
        title: "Allow List Provider",
        description: "If your address exists within the integrators list you get the stamps",
        name: "AllowList",
      },
    ],
  },
];

export const providers: Provider[] = [new AllowListProvider()];
