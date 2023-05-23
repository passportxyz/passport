import { PlatformSpec, platforms } from "@gitcoin/passport-platforms";

const localPlatforms = platforms;

export const getPlatformSpec = (platformName: string): PlatformSpec | undefined => {
  return localPlatforms[platformName]?.PlatformDetails;
};

export const PLATFORMS: PlatformSpec[] = Object.values(platforms).map((platform) => platform.PlatformDetails);
