import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { CustomGithubProvider } from "./Providers";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/star-light.svg",
  platform: "DeveloperList",
  name: "Custom Github Stamp",
  description: "Verify you are part of a community",
  connectMessage: "Verify",
  isEVM: true,
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Guest List",
    providers: [
      {
        title: "DeveloperList Provider",
        description: "Congrats! You are part of this community.",
        name: "DeveloperList",
      },
    ],
  },
];

export const providers: Provider[] = [new CustomGithubProvider()];
