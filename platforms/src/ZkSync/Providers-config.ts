import { PlatformSpec, PlatformGroupSpec, Provider } from "../types.js";
import { ZkSyncEraProvider } from "./Providers/zkSyncEra.js";
import { ZkSyncScore5Provider, ZkSyncScore20Provider, ZkSyncScore50Provider } from "./Providers/accountAnalysis.js";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/zksyncStampIcon.svg",
  platform: "ZkSync",
  name: "ZkSync",
  description: "Connect to zkSync to verify your zkSync wallet activity.",
  connectMessage: "Verify Account",
  isEVM: true,
  website: "https://zksync.io/",
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Engagement Levels in zkSync Era",
    providers: [
      {
        title: "Engagement Explorer",
        name: "zkSyncScore#5",
        description:
          "For users who authentically engage with the platform's varied features, showcasing unique, real-world usage.",
        isDeprecated: true,
      },
      {
        title: "L2 Believer",
        name: "zkSyncScore#20",
        description:
          "Rewards users who demonstrate genuine and consistent use, reflecting their true reliance on zkSync Era.",
        isDeprecated: true,
      },
      {
        title: "zkSync Champion",
        name: "zkSyncScore#50",
        description: "For leaders who contribute uniquely and authentically, positively impacting the community.",
        isDeprecated: true,
      },
    ],
  },
  {
    platformGroup: "Transactional Verification",
    providers: [
      {
        title: "Verified Transactor",
        name: "ZkSyncEra",
        description:
          "Recognizes users whose transactions on zkSync Era have achieved verified status, confirming their active participation and trust in the platform.",
        isDeprecated: true,
      },
    ],
  },
];

export const providers: Provider[] = [
  new ZkSyncEraProvider(),
  new ZkSyncScore5Provider(),
  new ZkSyncScore20Provider(),
  new ZkSyncScore50Provider(),
];
