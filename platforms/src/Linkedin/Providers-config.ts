import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { LinkedinProvider } from "./Providers/linkedin";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/linkedinStampIcon.svg",
  platform: "Linkedin",
  name: "Linkedin",
  description: "Connect your existing Linkedin account to verify.",
  connectMessage: "Connect Account",
  website: "https://www.linkedin.com",
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Account Name",
    providers: [{ title: "Encrypted", name: "Linkedin" }],
  },
];

export const providers: Provider[] = [new LinkedinProvider()];
