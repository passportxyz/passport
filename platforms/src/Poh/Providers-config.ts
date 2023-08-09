import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { PohProvider } from "./Providers/poh";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/pohStampIcon.svg",
  platform: "Poh",
  name: "Proof of Humanity",
  description: "Connect your wallet to start the process of verifying with Proof of Humanity.",
  connectMessage: "Connect Account",
  isEVM: true,
  website: "https://proofofhumanity.id",
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Account Name",
    providers: [{ title: "Encrypted", name: "Poh" }],
  },
];

export const providers: Provider[] = [new PohProvider()];
