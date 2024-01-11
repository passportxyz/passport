import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { IdenaAge5Provider, IdenaAge10Provider } from "./Providers/IdenaAgeProvider";
import { IdenaStake1kProvider, IdenaStake10kProvider, IdenaStake100kProvider } from "./Providers/IdenaStakeProvider";
import {
  IdenaStateNewbieProvider,
  IdenaStateVerifiedProvider,
  IdenaStateHumanProvider,
} from "./Providers/IdenaStateProvider";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/idenaStampIcon.svg",
  platform: "Idena",
  name: "Idena",
  description: "Connect to Idena to verify your human identity.",
  connectMessage: "Verify Identity",
  enablePlatformCardUpdate: true,
  website: "https://idena.io/",
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Identity State",
    providers: [
      { title: "Newbie", name: "IdenaState#Newbie" },
      { title: "Verified", name: "IdenaState#Verified" },
      { title: "Human", name: "IdenaState#Human" },
    ],
  },
  {
    platformGroup: "Identity Stake",
    providers: [
      { title: "more than 1k iDna", name: "IdenaStake#1k" },
      { title: "more than 10k iDna", name: "IdenaStake#10k" },
      { title: "more than 100k iDna", name: "IdenaStake#100k" },
    ],
  },
  {
    platformGroup: "Identity Age",
    providers: [
      { title: "more than 5 epochs", name: "IdenaAge#5" },
      { title: "more than 10 epochs", name: "IdenaAge#10" },
    ],
  },
];

export const providers: Provider[] = [
  new IdenaStateNewbieProvider(),
  new IdenaStateVerifiedProvider(),
  new IdenaStateHumanProvider(),
  new IdenaStake1kProvider(),
  new IdenaStake10kProvider(),
  new IdenaStake100kProvider(),
  new IdenaAge5Provider(),
  new IdenaAge10Provider(),
];
