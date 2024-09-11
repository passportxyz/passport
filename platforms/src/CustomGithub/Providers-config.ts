import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { CustomGithubProvider } from "./Providers";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/star-light.svg",
  platform: "CustomGithub",
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
        title: "Allow List Provider",
        description: "Congrats! You are part of this community.",
        name: "AllowList",
      },
    ],
  },
];

export const providers: Provider[] = [new CustomGithubProvider()];
