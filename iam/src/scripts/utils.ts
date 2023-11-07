import { PlatformGroupSpec, platforms } from "@gitcoin/passport-platforms";
import { StampMetadata } from "../utils/easPassportSchema";

export type StampData = {
  name: string;
  description: string;
  hash: string;
};

export type GroupData = {
  name: string;
  stamps: StampData[];
};

export const skipPlatforms = ["ClearText"];

/**
 *
 * @param s1 a set
 * @param s2 another set
 * @returns the difference between set s1 - s2
 */
export const difference = (s1: Set<string>, s2: Set<string>): Set<string> => {
  return new Set([...s1].filter((x) => !s2.has(x)));
};

export const formatPlatformGroups = (providerConfig: PlatformGroupSpec[]) =>
  providerConfig.reduce(
    (groups: GroupData[], group: PlatformGroupSpec) => [
      ...groups,
      {
        name: group.platformGroup,
        stamps: group.providers.map(({ name, title, hash }) => {
          if (!hash) {
            throw new Error(`No hash defined for ${name}`);
          }
          return {
            name,
            hash,
            description: title,
          };
        }),
      },
    ],
    [] as GroupData[]
  );

export const getPlatformData = (): StampMetadata => {
  return Object.entries(platforms).reduce((data, [id, platform]) => {
    if (skipPlatforms.includes(id)) return data;

    const { name, icon, description, connectMessage } = platform.PlatformDetails;
    if (!icon) throw new Error(`No icon defined for ${id}`);

    const groups = formatPlatformGroups(platform.ProviderConfig);

    return [
      ...data,
      {
        id,
        name,
        icon,
        description,
        connectMessage,
        groups,
      },
    ];
  }, [] as StampMetadata);
};
