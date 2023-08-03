import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { IDrissProvider } from "./Providers/IDrissProvider";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/idriss.svg",
  platform: "IDriss",
  name: "IDriss",
  description: "Register your IDriss and claim the membership NFT.",
  connectMessage: "Verify Membership",
  isEVM: true,
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Account Name",
    providers: [{ title: "Encrypted", name: "IDriss" }],
  },
];

export const providers: Provider[] = [new IDrissProvider()];
