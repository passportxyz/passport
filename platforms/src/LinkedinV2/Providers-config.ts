import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { LinkedinV2Provider, LinkedinV2EmailVerifiedProvider } from "./Providers/linkedin";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/linkedinStampIcon.svg",
  platform: "LinkedinV2",
  name: "Linkedin V2",
  description: "Connect your existing Linkedin account to verify.",
  connectMessage: "Connect Account to V2",
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Account Name V2",
    providers: [{ title: "Encrypted", name: "LinkedinV2" }, { title: "Email Verified", name: "LinkedinV2EmailVerified" }],
  },
];

export const providers: Provider[] = [new LinkedinV2Provider(), new LinkedinV2EmailVerifiedProvider()];
