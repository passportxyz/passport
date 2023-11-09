import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { TwitterAccountAgeProvider } from "./Providers/twitterAccountAge";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/twitterStampIcon.svg",
  platform: "Twitter",
  name: "Twitter",
  description: "Connect your existing Twitter account to verify.",
  connectMessage: "Connect Account",
  website: "https://x.com/",
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Account Creation",
    providers: [
      {
        title: "Created at least 180 days ago",
        name: "twitterAccountAgeGte#180",
      },
      {
        title: "Created at least 1 year ago",
        name: "twitterAccountAgeGte#365",
      },
      {
        title: "Created at least 2 years ago",
        name: "twitterAccountAgeGte#730",
      },
    ],
  },
];

export const providers: Provider[] = [
  new TwitterAccountAgeProvider({
    threshold: "180",
  }),
  new TwitterAccountAgeProvider({
    threshold: "365",
  }),
  new TwitterAccountAgeProvider({
    threshold: "730",
  }),
];
