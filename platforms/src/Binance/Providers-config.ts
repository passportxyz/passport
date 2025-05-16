import { PlatformSpec, PlatformGroupSpec, Provider } from "../types.js";
import { BinanceProvider2 } from "./Providers/binance.js";

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
        title: "Binance BABT Verification",
        description: "Verify your Binance Account Bound Token (BABT).",
        name: "BinanceBABT2",
      },
    ],
  },
];

export const providers: Provider[] = [new BinanceProvider2()];
