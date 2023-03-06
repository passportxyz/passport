import { PlatformSpec, PlatformGroupSpec } from "../types";

export const ImpactSelfPlatformDetails: PlatformSpec = {
  icon: "./assets/dottylandStampIcon.svg",
  platform: "ImpactSelf",
  name: "ImpactSelf",
  description: "Connect your wallet to verify ownership of an Impact Self. Claim at https://dottyland.xyz",
  connectMessage: "Verify Account",
  isEVM: true,
};

export const ImpactSelfProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Ownership",
    providers: [{ title: "A claimed Impact Self", name: "ImpactSelf#Claimed" }],
  },
  {
    platformGroup: "Score",
    providers: [
      { title: "More than 5", name: "ImpactSelf#Score#5" },
      { title: "More than 20", name: "ImpactSelf#Score#20" },
      { title: "More than 70", name: "ImpactSelf#Score#70" },
    ],
  },
  {
    platformGroup: "Connected Sources",
    providers: [
      { title: "More than 1", name: "ImpactSelf#ActiveSources#1" },
      { title: "More than 3", name: "ImpactSelf#ActiveSources#3" },
      { title: "More than 5", name: "ImpactSelf#ActiveSources#5" },
    ],
  },
];
