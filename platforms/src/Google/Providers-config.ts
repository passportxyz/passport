import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { GoogleProvider } from "./Providers/google";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/googleStampIcon.svg",
  platform: "Google",
  name: "Google",
  description: "Connect your existing Google Account to verify",
  connectMessage: "Connect Account",
  website: {
    uri: "https://www.google.com",
    display: "Connect to Google to verify your email address.",
  },
};

export const ProviderConfig: PlatformGroupSpec[] = [
  { platformGroup: "Account Name", providers: [{ title: "Google", name: "Google" }] },
];

export const providers: Provider[] = [new GoogleProvider()];
