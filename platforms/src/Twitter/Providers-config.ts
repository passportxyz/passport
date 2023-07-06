import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { TwitterAccountAgeProvider } from "./Providers/twitterAccountAge";
import { TwitterTweetDaysProvider } from "./Providers/twitterTweetDays";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/twitterStampIcon.svg",
  platform: "Twitter",
  name: "Twitter",
  description: "Connect your existing Twitter account to verify.",
  connectMessage: "Connect Account",
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
  {
    platformGroup: "Consistent Engagement",
    providers: [
      {
        title: "Tweet on at least 30 distinct days",
        name: "twitterTweetDaysGte#30",
      },
      {
        title: "Tweets on at least 60 distinct days",
        name: "twitterTweetDaysGte#60",
      },
      {
        title: "Tweets on at least 120 distinct days",
        name: "twitterTweetDaysGte#120",
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
  new TwitterTweetDaysProvider({
    threshold: "30",
  }),
  new TwitterTweetDaysProvider({
    threshold: "60",
  }),
  new TwitterTweetDaysProvider({
    threshold: "120",
  }),
];
