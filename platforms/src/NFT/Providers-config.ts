import { PlatformSpec, PlatformGroupSpec, Provider } from "../types.js";
import {
  NFTProvider,
  DigitalCollectorProvider,
  ArtAficionadoProvider,
  NftVisionaryProvider,
} from "./Providers/index.js";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/nftStampIcon.svg",
  platform: "NFT",
  name: "NFT",
  description: "Verify your Ethereum L1 NFT collection",
  connectMessage: "Connect NFT",
  isEVM: true,
  website: "https://ethereum.org/en/nft/",
  timeToGet: "< 1 minute",
  price: "Free",
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Collector's Journey",
    providers: [
      {
        name: "NFTScore#50",
        title: "Digital Collector",
        description: "Recognizes users beginning to explore the NFT space with a budding collection",
      },
      {
        name: "NFTScore#75",
        title: "Art Aficionado",
        description:
          "Highlights users with a significant, curated NFT portfolio demonstrating deeper involvement in digital art",
      },
      {
        name: "NFTScore#90",
        title: "NFT Visionary",
        description:
          "Distinguishes users at the forefront of the NFT movement with exceptional trend-setting collections",
      },
    ],
  },
  {
    platformGroup: "NFT Ownership Verification",
    providers: [
      {
        name: "NFT",
        title: "Holds at least 1 NFT (ERC-721)",
        description:
          "Verify ownership of at least one ERC-721 NFT on Ethereum mainnet as foundational NFT participation",
      },
    ],
  },
];

export const providers: Provider[] = [
  new NFTProvider(),
  new DigitalCollectorProvider(),
  new ArtAficionadoProvider(),
  new NftVisionaryProvider(),
];
