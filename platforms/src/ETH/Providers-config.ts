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
    platformGroup: "Ethereum Account Verification",
    providers: [
      { title: "ETH Advocate", name: "ETHAdvocate" },
      { title: "ETH Pioneer", name: "ETHPioneer" },
      { title: "ETH Maxi", name: "ETHMaxi" },
    ],
  },
];

export const providers: Provider[] = [new ETHAdvocateProvider(), new ETHPioneerProvider(), new ETHMaxiProvider()];
