import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { FacebookProvider } from "./Providers/facebook";
import { FacebookProfilePictureProvider } from "./Providers/facebookProfilePicture";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/facebookStampIcon.svg",
  platform: "Facebook",
  name: "Facebook",
  description: "Connect your existing account to verify with Facebook.",
  connectMessage: "Connect Account",
  website: "https://www.facebook.com",
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Account Name",
    providers: [{ title: "Encrypted", name: "Facebook" }],
  },
  {
    platformGroup: "Profile",
    providers: [{ title: "Profile Picture attached", name: "FacebookProfilePicture" }],
  },
];

export const providers: Provider[] = [new FacebookProvider(), new FacebookProfilePictureProvider()];
