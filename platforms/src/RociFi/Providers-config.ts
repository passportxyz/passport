import { PlatformSpec, PlatformGroupSpec } from "../types";

export const RociFiPlatformDetails: PlatformSpec = {
  icon: "./assets/rociFiStampIcon.svg",
  platform: "RociFi",
  name: "NFCS Holder",
  description: "Connect a wallet and validate the stamp by checking NFCS ownership.",
  connectMessage: "Connect NFCS",
};

export const RociFiProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "NFCS Holder",
    providers: [{ title: "Owner of NFCS", name: "RociFi" }],
  },
];
