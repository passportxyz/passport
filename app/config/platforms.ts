import { PlatformSpec, platforms } from "@gitcoin/passport-platforms";

export const getPlatformSpec = (platformName: string): PlatformSpec | undefined => {
  return platforms[platformName]?.PlatformDetails;
};

export const PLATFORMS: PlatformSpec[] = Object.values(platforms).map((platform) => platform.PlatformDetails);
