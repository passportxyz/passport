import { PlatformSpec, PlatformGroupSpec, Provider } from "../types.js";
import { XProvider } from "./Providers/x.js";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/xStampIcon.svg",
  platform: "X",
  name: "X",
  description: "Verify your X account with verified status, followers, and account age",
  connectMessage: "Connect Account",
  website: "https://x.com/",
  timeToGet: "1-2 minutes",
  price: "Free",
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Account Verification",
    providers: [
      {
        title: "Verify X Verified Account",
        description:
          "Verify that you own a verified X account (Premium, Premium+, Government, Business, or Legacy) with at least 100 followers and account age over 365 days",
        name: "X",
      },
    ],
  },
];

export const providers: Provider[] = [new XProvider()];
