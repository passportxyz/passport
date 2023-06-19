import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { ZkSyncLiteProvider } from "./Providers/zkSyncLite";
import { ZkSyncEraProvider } from "./Providers/zkSyncEra";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/zksyncStampIcon.svg",
  platform: "ZkSync",
  name: "ZkSync",
  description: "ZkSync Verification",
  connectMessage: "Verify Account",
  isEVM: true,
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "zkSync Lite",
    providers: [{ title: "Transacted on zkSync Lite", name: "ZkSyncLite" }],
  },
  {
    platformGroup: "zkSync Era",
    providers: [{ title: "Transacted on zkSync Era", name: "ZkSyncEra" }],
  },
];

export const providers: Provider[] = [new ZkSyncLiteProvider(), new ZkSyncEraProvider()];
