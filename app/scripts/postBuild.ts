import dotenv from "dotenv";
dotenv.config();

import { writeFileSync } from "fs";
import { join } from "path";

import { PlatformGroupSpec, platforms } from "@gitcoin/passport-platforms";

type StampData = {
  name: string;
  description: string;
  hash: string;
};

type GroupData = {
  name: string;
  stamps: StampData[];
};

type PlatformData = {
  name: string;
  icon: string;
  description: string;
  connectMessage: string;
  website: string;
  groups: GroupData[];
};

const skipPlatforms = ["ClearText"];

const formatPlatformGroups = (providerConfig: PlatformGroupSpec[]) =>
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

const platformsData = Object.entries(platforms).reduce((data, [id, platform]) => {
  if (skipPlatforms.includes(id)) return data;

  const { name, icon, description, connectMessage, website } = platform.PlatformDetails;
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
      website,
      groups,
    },
  ];
}, [] as PlatformData[]);

const outPath = join(__dirname, "..", "public", "stampMetadata.json");
console.log(`Saving platform info to JSON file at ${outPath}`);

writeFileSync(outPath, JSON.stringify(platformsData));
