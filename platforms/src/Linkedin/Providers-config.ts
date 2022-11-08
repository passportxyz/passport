import { PlatformSpec, PlatformGroupSpec } from "../types";

export const LinkedinPlatformDetails: PlatformSpec = {
  icon: "./assets/linkedinStampIcon.svg",
  platform: "Linkedin",
  name: "Linkedin",
  description: "Connect your existing Linkedin account to verify.",
  connectMessage: "Connect Account",
};

export const LinkedinProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Account Name",
    providers: [{ title: "Encrypted", name: "Linkedin" }],
  },
];
