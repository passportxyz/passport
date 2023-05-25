import dotenv from "dotenv";
import { writeFileSync } from "fs";
import { join } from "path";
import { keccak256, toUtf8Bytes } from "ethers";

import { PlatformGroupSpec, platforms } from "@gitcoin/passport-platforms";

dotenv.config();

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
  groups: GroupData[];
};

const skipPlatforms = ["ClearText"];

const formatPlatformGroups = (providerConfig: PlatformGroupSpec[]) =>
  providerConfig.reduce(
    (groups: GroupData[], group: PlatformGroupSpec) => [
      ...groups,
      {
        name: group.platformGroup,
        stamps: group.providers.map(({ name, title }) => ({
          name,
          description: title,
          hash: keccak256(toUtf8Bytes(name)),
        })),
      },
    ],
    [] as GroupData[]
  );

const platformsData = Object.entries(platforms).reduce((data, [id, platform]) => {
  if (skipPlatforms.includes(id)) return data;

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

const outPath = join(__dirname, "..", "public", "stampMetadata.json");
console.log(`Saving platform info to JSON file at ${outPath}`);

writeFileSync(outPath, JSON.stringify(platformsData));
