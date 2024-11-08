import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { LinkedinProvider } from "./Providers/linkedin";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/linkedinStampIcon.svg",
  platform: "Linkedin",
  name: "LinkedIn",
  description:
    "This stamp confirms that your LinkedIn account is verified and includes a valid, verified email address.",
  connectMessage: "Connect Account to LinkedIn",
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Account Verification",
    providers: [{ title: "Verified email address", name: "Linkedin" }],
  },
];

export const providers: Provider[] = [new LinkedinProvider()];
