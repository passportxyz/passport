import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { MicapassKycProvider, MicapassWalletScreeningProvider } from "./Providers";
import { MicapassIdentityProvider } from "./Providers/micapassIdentityProvider";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/micapass.svg",
  platform: "Micapass",
  name: "Micapass",
  description: "Connect to Micapass to verify your wallet risk score and KYC proofs.",
  connectMessage: "Connect To Micapass",
  isEVM: true,
  website: "https://app.micapass.com",
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Micapass",
    providers: [
      { title: "Prove your on chain identity deployment on Micapass", name: "MicapassIdentityProvider" },
      { title: "Verify your wallet screening proof on Micapass", name: "MicapassWalletScreeningProvider" },
      { title: "Verify your KYC proof on Micapass", name: "MicapassKycProvider" },
    ],
  },
];

export const providers: Provider[] = [
  new MicapassIdentityProvider(),
  new MicapassWalletScreeningProvider(),
  new MicapassKycProvider(),
];
