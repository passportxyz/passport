import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { UberRidesProvider } from "./Providers/uberRides";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/uber-icon.svg",
  platform: "Uber",
  name: "Uber",
  description:
    "Using Reclaim's zk technology, you can connect your Uber account without sharing any of the account information with Reclaim or Passport",
  connectMessage: "Connect Account",
  website: "https://uber.com/",
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Account has one ride",
    providers: [
      {
        title: "at least 1 ride",
        name: "UberRides",
      }
    ],
  },
];

export const providers: Provider[] = [
  new UberRidesProvider(),
];