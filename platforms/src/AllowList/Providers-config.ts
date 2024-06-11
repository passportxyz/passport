import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import {
  AllowListProvider
} from "./Providers";

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
        description: "Stake 5 GTC on at least 1 account or have 1 account stake 5 GTC on you.",
        name: "AllowList",
      },
    ],
  },
];

export const providers: Provider[] = [
  new AllowListProvider(),
];
