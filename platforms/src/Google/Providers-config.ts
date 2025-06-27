import { PlatformSpec, PlatformGroupSpec, Provider } from "../types.js";
import { GoogleProvider } from "./Providers/google.js";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/googleStampIcon.svg",
  platform: "Google",
  name: "Google",
  description: "Verify your Google account ownership",
  connectMessage: "Connect Account",
  website: "https://www.google.com/",
  timeToGet: "< 1 minute",
  price: "Free",
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Account Verification",
    providers: [
      {
        title: "Verify Google Account Ownership",
        description: "Connect and verify ownership of your Google account",
        name: "Google",
      },
    ],
  },
];

export const providers: Provider[] = [new GoogleProvider()];
