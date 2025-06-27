import { PlatformSpec, PlatformGroupSpec, Provider } from "../types.js";
import { GnosisSafeProvider } from "./Providers/index.js";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/gnosisSafeStampIcon.svg",
  platform: "GnosisSafe",
  name: "Safe",
  description: "Verify ownership of Safe multisig wallet",
  connectMessage: "Verify Account",
  isEVM: true,
  website: "https://safe.global/",
  timeToGet: "1 minute",
  price: "Free",
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Safe Verification",
    providers: [
      {
        title: "Safe Wallet Owner",
        description: "Verified ownership or signing authority for Safe multisig wallet on Ethereum",
        name: "GnosisSafe",
      },
    ],
  },
];

export const providers: Provider[] = [new GnosisSafeProvider()];
