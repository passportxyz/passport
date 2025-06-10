import { PlatformSpec, PlatformGroupSpec, Provider } from "../types.js";
import { HumanIdPhoneProvider } from "./Providers/humanIdPhone.js";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/humanIdStampIcon.svg",
  platform: "HumanIdPhone",
  name: "Human ID Phone",
  description: "Verify your phone number privately with Human ID",
  connectMessage: "Connect your wallet to verify your phone number",
  website: "https://human-id.org",
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Phone Verification",
    providers: [
      {
        title: "Phone SBT",
        name: "HumanIdPhone",
        description: "Proves you have verified your phone number through Human ID",
      },
    ],
  },
];

export const providers: Provider[] = [new HumanIdPhoneProvider()];
