import { PlatformSpec, PlatformGroupSpec, Provider } from "../types.js";
import { ZKEmailProvider } from "./Providers/zkemail.js";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/zkemailStampIcon.svg",
  platform: "ZKEmail",
  name: "ZK Email",
  description: "Connect to ZK Email to verify you took Uber trips and Amazon orders.",
  connectMessage: "Connect Account",
  website: "https://www.zk.email/",
};

export const ProviderConfig: PlatformGroupSpec[] = [
  { platformGroup: "Account Name", providers: [{ title: "ZK Email", name: "ZKEmail" }] },
];

export const providers: Provider[] = [new ZKEmailProvider()];
