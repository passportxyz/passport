import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { PohProvider } from "./Providers/poh";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/pohStampIcon.svg",
  platform: "Poh",
  name: "Proof of Humanity",
  description: "Connect to Proof of Humanity to verify your human identity on Web3.",
  connectMessage: "Connect Account",
  isEVM: true,
  website: "https://proofofhumanity.id/",
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Account Name",
    providers: [{ title: "Encrypted", name: "Poh" }],
  },
];

export const providers: Provider[] = [new PohProvider()];
