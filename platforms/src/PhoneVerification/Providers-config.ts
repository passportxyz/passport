import { PlatformSpec, PlatformGroupSpec, Provider } from "../types.js";
import { ZeronymPhoneProvider } from "./Providers/zeronymPhone.js";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/humanTechIcon.svg",
  platform: "PhoneVerification",
  name: "Phone Verification",
  description: "Connect to Zeronym by Holonym to verify your phone number.",
  connectMessage: "Connect Account",
  isEVM: true,
  website: "https://silksecure.net/holonym/diff-wallet/phone",
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Phone Number",
    providers: [
      {
        title: "Phone Number",
        name: "HolonymPhone",
        description: "Prove uniqueness using Zeronym phone verification.",
      },
    ],
  },
];

export const providers: Provider[] = [new ZeronymPhoneProvider()];
