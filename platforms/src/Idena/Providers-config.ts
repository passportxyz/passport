import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
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
];

export const providers: Provider[] = [
  new IdenaStateNewbieProvider(),
  new IdenaStateVerifiedProvider(),
  new IdenaStateHumanProvider(),
];
