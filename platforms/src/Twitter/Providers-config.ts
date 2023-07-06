import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { TwitterAccountAgeProvider } from "./Providers/twitterAccountAge";
import { TwitterTweetDaysProvider } from "./Providers/twitterTweetDays";
import * as legacyProviders from "./Providers/legacy";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/twitterStampIcon.svg",
  platform: "Twitter",
  name: "Twitter",
  description: "Connect your existing Twitter account to verify.",
  connectMessage: "Connect Account",
};

let providers: Provider[] = [];
let ProviderConfig: PlatformGroupSpec[] = [];

if (process.env.FF_NEW_TWITTER_STAMPS === "on" || process.env.NEXT_PUBLIC_FF_NEW_TWITTER_STAMPS === "on") {
  ProviderConfig = [
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
  providers = [
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
} else {
  ProviderConfig = [
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
  providers = [
    new legacyProviders.TwitterProvider(),
    new legacyProviders.TwitterTweetGT10Provider(),
    new legacyProviders.TwitterFollowerGT100Provider(),
    new legacyProviders.TwitterFollowerGT500Provider(),
    new legacyProviders.TwitterFollowerGTE1000Provider(),
    new legacyProviders.TwitterFollowerGT5000Provider(),
  ];
}

export { providers, ProviderConfig };
