import { PlatformSpec, PlatformGroupSpec, Provider } from "../types.js";
import { LinkedinProvider } from "./Providers/linkedin.js";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/linkedinStampIcon.svg",
  platform: "Linkedin",
  name: "LinkedIn",
  description: "Verify your LinkedIn account ownership",
  connectMessage: "Connect Account",
  website: "https://www.linkedin.com/",
  timeToGet: "1-2 minutes",
  price: "Free",
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Account Verification",
    providers: [
      {
        title: "Verify LinkedIn Account Ownership",
        description: "Connect and verify ownership of your LinkedIn account",
        name: "Linkedin",
      },
    ],
  },
];

export const providers: Provider[] = [new LinkedinProvider()];
