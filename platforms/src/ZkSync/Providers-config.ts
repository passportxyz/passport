import { PlatformSpec, PlatformGroupSpec } from "../types";

export const ZkSyncPlatformDetails: PlatformSpec = {
  icon: "./assets/zksyncStampIcon.svg",
  platform: "ZkSync",
  name: "ZkSync",
  description: "ZkSync Verification",
  connectMessage: "Verify Account",
  isEVM: true,
};

export const ZkSyncProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "zkSync 1.0",
    providers: [{ title: "Transacted on zkSync 1.0", name: "ZkSync" }],
  },
];
