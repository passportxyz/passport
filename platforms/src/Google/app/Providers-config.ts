import { PlatformSpec, PlatformGroupSpec } from "../../types";

export const GooglePlatformDetails: PlatformSpec = {
  icon: "./assets/googleStampIcon.svg",
  platform: "Google",
  name: "Google",
  description: "Connect your existing Google Account to verify",
  connectMessage: "Connect Account",
};

export const GoogleProviderConfig: PlatformGroupSpec[] = [
  { platformGroup: "Account Name", providers: [{ title: "Google", name: "Google" }] },
];
