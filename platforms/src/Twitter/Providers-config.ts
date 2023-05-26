import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import TwitterAuthProvider from "./Providers/TwitterAuthProvider";
import {
  TwitterFollowerGT100Provider,
  TwitterFollowerGT500Provider,
  TwitterFollowerGTE1000Provider,
  TwitterFollowerGT5000Provider,
} from "./Providers/TwitterFollowerProvider";
import { TwitterTweetGT10Provider } from "./Providers/TwitterTweetsProvider";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/twitterStampIcon.svg",
  platform: "Twitter",
  name: "Twitter",
  description: "Connect your existing Twitter account to verify.",
  connectMessage: "Connect Account",
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Account Name",
    providers: [{ title: "Encrypted", name: "Twitter" }],
  },
  {
    platformGroup: "Tweet/Posts",
    providers: [{ title: "More than 10", name: "TwitterTweetGT10" }],
  },
  {
    platformGroup: "Followers",
    providers: [
      { title: "More than 100", name: "TwitterFollowerGT100" },
      {
        title: "More than 500",
        name: "TwitterFollowerGT500",
      },
      {
        title: "More than 1000",
        name: "TwitterFollowerGTE1000",
      },
      {
        title: "More than 5000",
        name: "TwitterFollowerGT5000",
      },
    ],
  },
];

export const providers: Provider[] = [
  new TwitterAuthProvider(),
  new TwitterTweetGT10Provider(),
  new TwitterFollowerGT100Provider(),
  new TwitterFollowerGT500Provider(),
  new TwitterFollowerGTE1000Provider(),
  new TwitterFollowerGT5000Provider(),
];
