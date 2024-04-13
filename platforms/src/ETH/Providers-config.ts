import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { ETHAdvocateProvider, ETHMaxiProvider, ETHEnthusiastProvider } from "./Providers/accountAnalysis";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/ethereumStampIcon.svg",
  platform: "ETH",
  name: "Ethereum",
  description: "Verify Ethereum activity.",
  connectMessage: "Verify Account",
  isEVM: true,
  website:
    "https://support.gitcoin.co/gitcoin-knowledge-base/gitcoin-passport/navigating-your-ethereum-stamp-insights-and-updates",
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Ethereum Involvement Spectrum",
    providers: [
      {
        title: "ETH Enthusiast",
        name: "ETHEnthusiast",
        description: "Your journey begins here, showcasing initial engagement and support for the Ethereum ecosystem.",
      },
      {
        title: "ETH Advocate",
        name: "ETHAdvocate",
        description: "Continued commitment and participation in the Ethereum ecosystem.",
      },
      {
        title: "ETH Maxi",
        name: "ETHMaxi",
        description:
          "The ultimate badge of honor, embodying full-fledged advocacy and a dominant presence in the community.",
      },
    ],
  },
];

export const providers: Provider[] = [new ETHEnthusiastProvider(), new ETHAdvocateProvider(), new ETHMaxiProvider()];
