import { PlatformSpec, PlatformGroupSpec, Provider } from "../types.js";
import { ClanHandsProvider } from "./Providers/index.js";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/proofOfCleanHandsWhite.svg",
  platform: "CleanHands",
  name: "Clean Hands",
  description: "Privately prove you are not sanctioned using Proof of Clean Hands",
  connectMessage: "Verify Account",
  isEVM: true,
  website: "https://silksecure.net/holonym/diff-wallet/clean-hands/issuance/prereqs",
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Clean Hands",
    providers: [{ title: "Prove clean hands ...", name: "CleanHands" }],
  },
];

export const providers: Provider[] = [new ClanHandsProvider()];
