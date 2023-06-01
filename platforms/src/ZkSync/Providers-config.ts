import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { ZkSyncProvider, ZkSyncEraProvider } from "./Providers/zkSync";

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
    platformGroup: "zkSync 1.0",
    providers: [{ title: "Transacted on zkSync 1.0", name: "ZkSync" }],
  },
  {
    platformGroup: "zkSync Era",
    providers: [{ title: "Transacted on zkSync Era", name: "ZkSyncEra" }],
  },
];

export const providers: Provider[] = [new ZkSyncProvider(), new ZkSyncEraProvider()];
