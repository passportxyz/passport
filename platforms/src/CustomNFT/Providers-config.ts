import { PlatformSpec, PlatformGroupSpec, Provider } from "../types.js";
import { NFTHolderProvider } from "./Providers/index.js";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/nftStampIcon.svg",
  platform: "NFTHolder",
  name: "NFT Holder",
  description: "Verify NFT ownership",
  connectMessage: "Verify",
  isEVM: true,
};

// Empty — custom stamp credentials come dynamically from the API
export const ProviderConfig: PlatformGroupSpec[] = [];

export const providers: Provider[] = [new NFTHolderProvider()];
