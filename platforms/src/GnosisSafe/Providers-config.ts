import { PlatformSpec, PlatformGroupSpec, Provider } from "../types.js";
import { GnosisSafeProvider } from "./Providers/index.js";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/gnosisSafeStampIcon.svg",
  platform: "GnosisSafe",
  name: "Gnosis Safe",
  description: "Gnosis Safe Signer/Owner Verification",
  connectMessage: "Verify Account",
  isEVM: true,
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Account Name",
    providers: [{ title: "Encrypted", name: "GnosisSafe" }],
  },
];

export const providers: Provider[] = [new GnosisSafeProvider()];
