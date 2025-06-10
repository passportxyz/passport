import { PlatformSpec, PlatformGroupSpec, Provider } from "../types.js";
import { HumanIdKycProvider } from "./Providers/humanIdKyc.js";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/humanIdStampIcon.svg",
  platform: "HumanIdKyc",
  name: "Human ID KYC",
  description: "Complete KYC verification privately with Human ID",
  connectMessage: "Connect your wallet to complete KYC verification",
  website: "https://human-id.org",
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Identity Verification",
    providers: [
      {
        title: "KYC SBT",
        name: "HumanIdKyc",
        description: "Proves you have completed KYC verification through Human ID",
      },
    ],
  },
];

export const providers: Provider[] = [new HumanIdKycProvider()];
