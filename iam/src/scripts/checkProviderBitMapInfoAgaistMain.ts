import dotenv from "dotenv";
dotenv.config();

import { PassportAttestationStamp } from "../utils/easPassportSchema";
import currentBitmap from "../static/providerBitMapInfo.json";
import { difference } from "./utils";

import { exec } from "child_process";

const processArgs = process.argv.slice(2);

if (processArgs.length < 1) {
  console.error(
    "This script will check that there are no items removed in the current version of the\n\
when compared to a base revision (for example against origin/main).\n\
\n\
Call this script with the following arguments:\n\
- <baseRevision> - the revision against you want to compare the current providerBitMapInfo.json"
  );
  process.exit(1);
}

export const checkNoDeletionsInExpectedBitmap = (
  expected: PassportAttestationStamp[],
  actual: PassportAttestationStamp[]
): boolean => {
  const sExpected = new Set(expected.map((item) => `${item.index}:${item.bit}:${item.name}`).sort());
  const sActual = new Set(actual.map((item) => `${item.index}:${item.bit}:${item.name}`).sort());

  const missingInExpectedSet = difference(sExpected, sActual);

  if (missingInExpectedSet.size > 0) {
    console.error("Items that have been removed:");
    console.error(JSON.stringify([...missingInExpectedSet]));
  }

  return missingInExpectedSet.size === 0;
};

const baseRevision = processArgs[0];
console.log(`Base revision:\n${baseRevision}`);

const gitShowCommand = `git show ${baseRevision}:./src/static/providerBitMapInfo.json`;
console.log("running command: ", gitShowCommand);

exec(gitShowCommand, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error executing command: ${error.message}`);
    process.exit(1);
    return;
  }

  if (stderr) {
    console.error(`Command stderr: ${stderr}`);
    process.exit(1);
    return;
  }

  console.log(`Command output (old version):\n${stdout}`);
  const previousBitmap = JSON.parse(stdout) as PassportAttestationStamp[];

  const isBitmapOk = checkNoDeletionsInExpectedBitmap(previousBitmap, currentBitmap);
  if (isBitmapOk) {
    console.log("Bitmaps are OK!");
    process.exit(0);
  } else {
    console.log("Bitmaps are not OK!");
    process.exit(1);
  }
});
