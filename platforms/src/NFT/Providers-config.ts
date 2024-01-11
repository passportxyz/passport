import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { NFTProvider } from "./Providers";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/nftStampIcon.svg",
  platform: "NFT",
  name: "NFT Holder",
  description:
    "Connect your Ethereum wallet to verify that you own an Ethereum-based NFT. Currently, we only recognize NFTs (ERC-721s).",
  connectMessage: "Connect NFT",
  isEVM: true,
  website: "https://ethereum.org/en/nft/",
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "NFT Holder",
    providers: [{ title: "Holds at least 1 NFT", name: "NFT" }],
  },
];

export const providers: Provider[] = [new NFTProvider()];
