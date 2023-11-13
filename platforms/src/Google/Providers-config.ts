import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { GoogleProvider } from "./Providers/google";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/googleStampIcon.svg",
  platform: "Google",
  name: "Google",
  description: "Connect to Google to verify your email address.",
  connectMessage: "Connect Account",
  website: "https://www.google.com/",
};

export const ProviderConfig: PlatformGroupSpec[] = [
  { platformGroup: "Account Name", providers: [{ title: "Google", name: "Google" }] },
];

export const providers: Provider[] = [new GoogleProvider()];
