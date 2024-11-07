import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { LinkedinV2Provider } from "./Providers/linkedin";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/linkedinStampIcon.svg",
  platform: "LinkedinV2",
  name: "Linkedin V2",
  description:
    "This stamp confirms that your LinkedIn account is verified and includes a valid, verified email address.",
  connectMessage: "Connect Account to V2",
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Account Verification",
    providers: [{ title: "Verified email address", name: "LinkedinV2" }],
  },
];

export const providers: Provider[] = [new LinkedinV2Provider()];
