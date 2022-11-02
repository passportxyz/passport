import { PlatformSpec, PlatformGroupSpec } from "../types";

export const ZkSyncPlatformDetails: PlatformSpec = {
  icon: "./assets/zksyncStampIcon.svg",
  platform: "ZkSync",
  name: "ZkSync",
  description: "ZkSync Verification",
  connectMessage: "Verify Account",
  isEVM: true,
};

export const ZKSyncProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Account name",
    providers: [{ title: "Encrypted", name: "ZkSync" }],
  },
];
