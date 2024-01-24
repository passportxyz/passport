import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { ETHAdvocateProvider, ETHPioneerProvider, ETHMaxiProvider } from "./Providers/accountAnalysis";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/ethereumStampIcon.svg",
  platform: "ETH",
  name: "Ethereum",
  description: "Connect to Ethereum to verify your network activity.",
  connectMessage: "Verify Account",
  isEVM: true,
  website: "https://ethereum.org",
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Ethereum Involvement Spectrum",
    providers: [
      {
        title: "1. ETH Enthusiast",
        name: "ETHAdvocate",
        description: "Your journey begins here, showcasing initial engagement and support for the Ethereum ecosystem.",
      },
      {
        title: "2. ETH Pioneer",
        name: "ETHPioneer",
        description: "A step up, reflecting ongoing commitment and active participation in Ethereum's growth.",
      },
      {
        title: "3. ETH Maxi",
        name: "ETHMaxi",
        description:
          "The ultimate badge of honor, embodying full-fledged advocacy and a dominant presence in the community.",
      },
    ],
  },
];

export const providers: Provider[] = [new ETHAdvocateProvider(), new ETHPioneerProvider(), new ETHMaxiProvider()];
