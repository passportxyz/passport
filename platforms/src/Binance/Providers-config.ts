import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { BinanceProvider } from "./Providers/binance";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/binanceStamp.svg",
  platform: "Binance",
  name: "Binance",
  description: "Confirm your Binance Account Bound Token to prove your KYC",
  connectMessage: "Connect Account",
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Confirm your Binance Account Bound Token (BABT)",
    providers: [
      {
        title: "Verified Binance Account",
        description: "Account has valid BABT",
        name: "BinanceBABT",
      },
    ],
  },
];

export const providers: Provider[] = [new BinanceProvider()];
