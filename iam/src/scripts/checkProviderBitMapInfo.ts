import dotenv from "dotenv";
dotenv.config();

import axios from "axios";
import { writeFileSync } from "fs";
import { join } from "path";

import { PlatformGroupSpec, platforms } from "@gitcoin/passport-platforms";

import { PassportAttestationStamp, StampMetadata, mapBitMapInfo } from "../utils/easPassportSchema";
import currentBitmap from "../static/providerBitMapInfo.json";

const processArgs = process.argv.slice(2);

if(processArgs.length < 1) {
  console.error("The following arguments are expected: <baseRevision>");
  process.exit(1);
}

const stampMetadataEndpoint = process.env.PASSPORT_STAMP_METADATA_PATH || "";

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

/**
 * These platforms are not included in the bitmap, as they have already been retired
 * We should pprobably include a `retired` flag in the platform definition.
 */
const skipPlatformsForBitmap = ["ClearText"];

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

const getPlatformData = (): StampMetadata => {
  return Object.entries(platforms).reduce((data, [id, platform]) => {
    if (skipPlatformsForBitmap.includes(id)) return data;

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

const compatePassportAttestation = (a: PassportAttestationStamp, b: PassportAttestationStamp) => {
  if (a.index - b.index !== 0) {
    return a.index - b.index;
  }
  if (a.bit - b.bit !== 0) {
    return a.bit - b.bit;
  }

  return a.name.localeCompare(b.name);
};

const checkBitmap = (expected: PassportAttestationStamp[], actual: PassportAttestationStamp[]): boolean => {
  let isBitmapOk = true;
  const sExpected = expected.sort(compatePassportAttestation);
  const sActual = actual.sort(compatePassportAttestation);

  // console.log(sExpected);
  // console.log("XXXXXXXXXXXXXX");
  // console.log("XXXXXXXXXXXXXX");
  // console.log("XXXXXXXXXXXXXX");
  // console.log(sActual);

  if (sExpected.length !== sActual.length) {
    console.error("Bitmap does not have expected length");
    isBitmapOk = false;
  }

  const missingExpectedItems: string[] = [];
  const missingActualItems: string[] = [];

  for (let i = 0; i < sExpected.length; i++) {
    const expectedItem = sExpected[i];
    const foundIndex = sActual.findIndex((actualItem) => {
      return actualItem.name === expectedItem.name;
    });
    if (foundIndex === -1) {
      missingExpectedItems.push(expectedItem.name);
    }
  }

  for (let i = 0; i < sActual.length; i++) {
    const actualItem = sActual[i];
    const foundIndex = sExpected.findIndex((expectedItem) => {
      return actualItem.name === expectedItem.name;
    });
    if (foundIndex === -1) {
      missingActualItems.push(actualItem.name);
    }
  }

  for (let i = 0; i < Math.min(sExpected.length, sActual.length); i++) {
    const expectedItem = sExpected[i];
    const actualItem = sActual[i];

    if (
      expectedItem.index !== actualItem.index ||
      expectedItem.bit !== actualItem.bit ||
      expectedItem.name !== actualItem.name
    ) {
      isBitmapOk = false;

      console.error("----------------------------------------");
      console.error("Found 2 distinct items");
      console.error("    - expected");
      console.error(expectedItem);
      console.error("    - actual");
      console.error(actualItem);
    }
  }

  console.error("----------------------------------------");
  console.error("Items to add into the bitMap", missingActualItems);
  console.info(
    "Items that have been removed (make sure to create a new version of the bitmap)\nThese are items in the bitmap that are not in the app any more",
    missingExpectedItems
  );

  if (missingActualItems.length > 0) {
    isBitmapOk = false;
  }
  return isBitmapOk;
};

const checkProviderBitMapInfo = (): boolean => {
  const stampMetadata = getPlatformData();
  const actualBitMapInfo = mapBitMapInfo(stampMetadata);

  return checkBitmap(currentBitmap, actualBitMapInfo);
};

// checkProviderBitMapInfo()
//   .then((isOk) => {
//     if (isOk) {
//       console.log("Bitmaps are equal!");
//       process.exit(0);
//     } else {
//       console.error(
//         "*********************************************\n\
// * ERROR : Attestation bitmap needs update   *\n\
// *********************************************"
//       );
//       process.exit(1);
//     }
//   })
//   .catch((err) => {
//     console.error(err);
//     process.exit(1);
//   });

import { exec } from "child_process";

// Command to read the last version of the bitmap
const command = "git log -n10 --format=format:%H ./src/static/providerBitMapInfo.json";

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error executing command: ${error.message}`);
    process.exit(1);
    return;
  }

  if (stderr) {
    console.error(`Command stderr: ${stderr}`);
    process.exit(1);
  }

  console.log(`Command output:\n${stdout}`);

  const revisions = stdout.split("\n");
  console.log(`Revisions:\n${JSON.stringify(revisions)}`);

  const baseRevision = processArgs[0];
  console.log(`Base revision:\n${baseRevision}`);

  const gutShowCommand = `git show ${baseRevision}:./src/static/providerBitMapInfo.json`;

  exec(gutShowCommand, (error, stdout, stderr) => {
    const previousBitmap = JSON.parse(stdout) as PassportAttestationStamp[];
    if (error) {
      console.error(`Error executing command: ${error.message}`);
      process.exit(1);
      return;
    }

    if (stderr) {
      console.error(`Command stderr: ${stderr}`);
      process.exit(1);
    }

    console.log(`Command output:\n${stdout}`);

    const isBitmapOk = checkBitmap(previousBitmap, currentBitmap);
    if (isBitmapOk) {
      console.log("Bitmaps are OK!");
    } else {
      console.log("Bitmaps are not OK!");
    }
  });
});
