import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { GnosisSafeProvider } from "./Providers";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/gnosisSafeStampIcon.svg",
  platform: "GnosisSafe",
  name: "Gnosis Safe",
  description: "Gnosis Safe Signer/Owner Verification",
  connectMessage: "Verify Account",
  isEVM: true,
  website: "https://safe.global",
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Account Name",
    providers: [{ title: "Encrypted", name: "GnosisSafe" }],
  },
];

export const providers: Provider[] = [new GnosisSafeProvider()];
