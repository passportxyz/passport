import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { EtherscoreBronzeProvider, EtherscoreSilverProvider, EtherscoreGoldProvider } from "./Providers/Etherscore";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/etherscoreStampIcon.svg",
  platform: "Etherscore",
  name: "Etherscore",
  description: "Etherscore badge verification",
  connectMessage: "Verify Account",
  isEVM: true,
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "EtherScore badge possessions",
    providers: [
      { title: "At least 10 badges (bronze)", name: "EtherscoreBronze" },
      { title: "At least 20 badges (silver)", name: "EtherscoreSilver" },
      { title: "At least 30 badges (gold)", name: "EtherscoreGold" },
    ],
  },
];

export const providers: Provider[] = [
  new EtherscoreBronzeProvider(),
  new EtherscoreSilverProvider(),
  new EtherscoreGoldProvider(),
];
