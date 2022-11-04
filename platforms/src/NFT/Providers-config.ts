import { PlatformSpec, PlatformGroupSpec } from "../types";

export const NFTPlatformDetails: PlatformSpec = {
  icon: "./assets/nftStampIcon.svg",
  platform: "NFT",
  name: "NFT Holder",
  description: "Connect a wallet and validate the stamp by retrieving an NFT.",
  connectMessage: "Connect NFT",
};

export const NFTProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "NFT Holder",
    providers: [{ title: "Holds at least 1 NFT", name: "NFT" }],
  },
];
