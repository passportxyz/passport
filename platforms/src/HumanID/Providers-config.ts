import { PlatformSpec, PlatformGroupSpec, Provider } from "../types.js";
import { HumanIdPhoneProvider } from "./Providers/humanIdPhone.js";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/humanIdStampIcon.svg",
  platform: "HumanID",
  name: "Human ID",
  description: "Verify your phone number privately with Human ID",
  connectMessage: "Connect your wallet to verify with Human ID",
  website: "https://human-id.org",
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Phone Verification",
    providers: [
      {
        title: "Phone SBT",
        name: "HumanIdPhone",
        description: "Proves you have verified your phone number",
      },
    ],
  },
];

export const providers: Provider[] = [new HumanIdPhoneProvider()];
