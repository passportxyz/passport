import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { AlloContributorStatisticsProvider } from "./Providers";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/Allo_Logomark_ChartreuseSkyBlue_Gradient.svg",
  platform: "Allo",
  name: "Allo",
  description: "Connect with Github to verify with your Gitcoin account.",
  connectMessage: "Connect Account",
  isEVM: true,
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Projects Contributed To",
    providers: [
      { title: "Supported 3+ unique projects", name: "AlloContributorStatistics#alloProjectsContributedToGte#3" },
      { title: "Supported 5+ unique projects", name: "AlloContributorStatistics#alloProjectsContributedToGte#5" },
      { title: "Supported 7+ unique projects", name: "AlloContributorStatistics#alloProjectsContributedToGte#7" },
    ],
  },
  {
    platformGroup: "Matching Fund Programs Participation",
    providers: [
      { title: "Contributed to 2+ unique programs", name: "AlloContributorStatistics#alloRoundsParticipatedInGte#2" },
      { title: "Contributed to 4+ unique programs", name: "AlloContributorStatistics#alloRoundsParticipatedInGte#4" },
      { title: "Contributed to 6+ unique programs", name: "AlloContributorStatistics#alloRoundsParticipatedInGte#6" },
    ],
  },
];

export const providers: Provider[] = [
  // --- GitcoinContributorStatisticsProvider ---
  new AlloContributorStatisticsProvider({
    threshold: 3,
    receivingAttribute: "num_projects",
    recordAttribute: "alloProjectsContributedToGte",
  }),
  new AlloContributorStatisticsProvider({
    threshold: 5,
    receivingAttribute: "num_projects",
    recordAttribute: "alloProjectsContributedToGte",
  }),
  new AlloContributorStatisticsProvider({
    threshold: 7,
    receivingAttribute: "num_projects",
    recordAttribute: "alloProjectsContributedToGte",
  }),

  new AlloContributorStatisticsProvider({
    threshold: 2,
    receivingAttribute: "num_projects",
    recordAttribute: "alloRoundsParticipatedInGte",
  }),
  new AlloContributorStatisticsProvider({
    threshold: 4,
    receivingAttribute: "num_projects",
    recordAttribute: "alloRoundsParticipatedInGte",
  }),
  new AlloContributorStatisticsProvider({
    threshold: 6,
    receivingAttribute: "num_projects",
    recordAttribute: "alloRoundsParticipatedInGte",
  }),
];
