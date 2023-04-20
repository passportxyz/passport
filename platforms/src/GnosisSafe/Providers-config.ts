import { PlatformSpec, PlatformGroupSpec } from "../types";

export const GnosisSafePlatformDetails: PlatformSpec = {
  icon: "./assets/gnosisSafeStampIcon.svg",
  platform: "GnosisSafe",
  name: "Gnosis Safe",
  description: "Gnosis Safe Signer/Owner Verification",
  connectMessage: "Verify Account",
  isEVM: true,
};

export const GnosisSafeProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Account Name",
    providers: [{ title: "Encrypted", name: "GnosisSafe" }],
  },
];
