import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { ZkSyncLiteProvider } from "./Providers/zkSyncLite";
import { ZkSyncEraProvider } from "./Providers/zkSyncEra";

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
    platformGroup: "zkSync Lite",
    providers: [{ title: "Transacted on zkSync Lite", name: "ZkSync" }],
  },
  {
    platformGroup: "zkSync Era",
    providers: [{ title: "Transacted on zkSync Era", name: "ZkSyncEra" }],
  },
];

export const providers: Provider[] = [new ZkSyncLiteProvider(), new ZkSyncEraProvider()];
