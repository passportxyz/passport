import { PlatformSpec, PlatformGroupSpec, Provider } from "../types.js";
import {
  IdenaStateNewbieProvider,
  IdenaStateVerifiedProvider,
  IdenaStateHumanProvider,
} from "./Providers/IdenaStateProvider.js";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/idenaStampIcon.svg",
  platform: "Idena",
  name: "Idena",
  description: "Prove Your Unique Humanity with Idena",
  connectMessage: "Verify Identity",
  enablePlatformCardUpdate: true,
  website: "https://idena.io/",
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Identity State",
    providers: [
      {
        title: "Newbie",
        name: "IdenaState#Newbie",
        description:
          "Granted after passing the initial validation, indicating your verification initiation in the Idena system.",
      },
      {
        title: "Verified",
        name: "IdenaState#Verified",
        description: "Achieved by successfully completing three consecutive validations with a Total score >= 75%.",
      },
      {
        title: "Human",
        name: "IdenaState#Human",
        description: "Earned through four consecutive successful validations and maintaining a Total score >= 92%.",
      },
    ],
  },
];

export const providers: Provider[] = [
  new IdenaStateNewbieProvider(),
  new IdenaStateVerifiedProvider(),
  new IdenaStateHumanProvider(),
];
