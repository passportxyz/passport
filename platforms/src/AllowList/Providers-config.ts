import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { AllowListProvider } from "./Providers";

export const PlatformDetails: PlatformSpec = {
  icon: "tbd",
  platform: "AllowList",
  name: "AllowList",
  description: "tbd",
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
