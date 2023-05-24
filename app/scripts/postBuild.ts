import dotenv from "dotenv";
import { writeFileSync } from "fs";
import { join } from "path";

import { PlatformGroupSpec, platforms } from "@gitcoin/passport-platforms";

dotenv.config();

type GroupData = {
  name: string;
  stamps: string[];
};

type PlatformData = {
  name: string;
  icon: string;
  description: string;
  connectMessage: string;
  groups: GroupData[];
};

const formatPlatformGroups = (providerConfig: PlatformGroupSpec[]) =>
  providerConfig.reduce(
    (groups: GroupData[], group: PlatformGroupSpec) => [
      ...groups,
      {
        name: group.platformGroup,
        stamps: group.providers.map(({ name }) => name),
      },
    ],
    [] as GroupData[]
  );

const platformsData = Object.entries(platforms).reduce((data, [id, platform]) => {
  const { name, icon, description, connectMessage } = platform.PlatformDetails;
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
}, [] as PlatformData[]);

const outPath = join(__dirname, "..", "public", "platforms.json");
console.log(`Saving platform info to JSON file at ${outPath}`);

writeFileSync(outPath, JSON.stringify(platformsData));
