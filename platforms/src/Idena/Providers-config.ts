import { PlatformSpec, PlatformGroupSpec } from "../types";

export const IdenaPlatformDetails: PlatformSpec = {
  icon: "./assets/idenaStampIcon.svg",
  platform: "Idena",
  name: "Idena",
  description: "Connect your existing Identity to verify.",
  connectMessage: "Verify Identity",
  enablePlatformCardUpdate: true,
};

export const IdenaProviderConfig: PlatformGroupSpec[] = [
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
