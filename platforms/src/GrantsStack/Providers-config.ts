import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { GrantsStackProvider } from "./Providers/GrantsStack";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/grantsStackLogo.svg",
  platform: "GrantsStack",
  name: "GrantsStack",
  description: "Connect your existing GrantsStack Account to verify",
  connectMessage: "Connect Account",
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Projects Contributed To:",
    providers: [
      { title: "Supported 3+ unique projects", name: "GrantsStack3Projects" },
      { title: "Supported 5+ unique projects", name: "GrantsStack5Projects" },
      { title: "Supported 7+ unique projects", name: "GrantsStack7Projects" },
    ],
  },
  {
    platformGroup: "Matching Fund Programs Participation:",
    providers: [
      { title: "Contributed to 2+ unique programs.", name: "GrantsStack2Programs" },
      { title: "Contributed to 4+ unique programs.", name: "GrantsStack4Programs" },
      { title: "Contributed to 6+ unique programs.", name: "GrantsStack6Programs" },
    ],
  },
];

export const providers: Provider[] = [
  new GrantsStackProvider({
    type: "GrantsStack3Projects",
    dataKey: "projectCount",
    threshold: 3,
  }),
  new GrantsStackProvider({
    type: "GrantsStack5Projects",
    dataKey: "projectCount",
    threshold: 5,
  }),
  new GrantsStackProvider({
    type: "GrantsStack7Projects",
    dataKey: "projectCount",
    threshold: 7,
  }),
  new GrantsStackProvider({
    type: "GrantsStack2Programs",
    dataKey: "programCount",
    threshold: 2,
  }),
  new GrantsStackProvider({
    type: "GrantsStack4Programs",
    dataKey: "programCount",
    threshold: 4,
  }),
  new GrantsStackProvider({
    type: "GrantsStack6Programs",
    dataKey: "programCount",
    threshold: 6,
  }),
];
