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
    platformGroup: "Account # of Rides",
    providers: [
      {
        title: "at least 1 ride",
        name: "uberRidesGte#1",
      },
      {
        title: "at least 10 rides",
        name: "uberRidesGte#10",
      },
      {
        title: "at least 100 rides",
        name: "uberRidesGte#100",
      },
      {
        title: "at least 1000 rides",
        name: "uberRidesGte#1000",
      },
    ],
  },
];

export const providers: Provider[] = [
  new UberRidesProvider({
    threshold: "1",
  }),
  new UberRidesProvider({
    threshold: "10",
  }),
  new UberRidesProvider({
    threshold: "100",
  }),
  new UberRidesProvider({
    threshold: "1000",
  }),
];
