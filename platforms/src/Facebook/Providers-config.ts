import { PlatformSpec, PlatformGroupSpec } from "../types";

export const FacebookPlatformDetails: PlatformSpec = {
  icon: "./assets/facebookStampIcon.svg",
  platform: "Facebook",
  name: "Facebook",
  description: "Connect your existing account to verify with Facebook.",
  connectMessage: "Connect Account",
};

export const FacebookProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Account Name",
    providers: [{ title: "Encrypted", name: "Facebook" }],
  },
  {
    platformGroup: "Friends",
    providers: [{ title: "Greater than 100", name: "FacebookFriends" }],
  },
  {
    platformGroup: "Profile",
    providers: [{ title: "Profile Picture attached", name: "FacebookProfilePicture" }],
  },
];
