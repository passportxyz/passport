import dotenv from "dotenv";
dotenv.config();

import { PassportAttestationStamp, mapBitMapInfo } from "../utils/easPassportSchema";

import currentBitmap from "../static/providerBitMapInfo.json";
import { getPlatformData, difference } from "./utils";

/**
 *
 * @param expected The expected bitmap. This could be the base version against which we want to compare.
 * @param actual An actual (current, new) version of the bitmap. This is what we want to check.
 * @returns true / false depending on whether there are any items missing in the expected bitmap
 */
export const checkNoProvidersMissingInExpectedBitmap = (
  expected: PassportAttestationStamp[],
  actual: PassportAttestationStamp[]
): boolean => {
  const sExpected = new Set(expected.map((item) => `${item.index}:${item.bit}:${item.name}`).sort());
  const sActual = new Set(actual.map((item) => `${item.index}:${item.bit}:${item.name}`).sort());

  const missingInExpectedSet = difference(sActual, sExpected);

  if (missingInExpectedSet.size > 0) {
    console.error("Items that are not in the expected (old) bitmap:");
    console.error(JSON.stringify([...missingInExpectedSet]));
  }

  return missingInExpectedSet.size === 0;
};

const checkProviderBitMapInfo = (): boolean => {
  const stampMetadata = getPlatformData();
  const actualBitMapInfo = mapBitMapInfo(stampMetadata);

  return checkNoProvidersMissingInExpectedBitmap(currentBitmap, actualBitMapInfo);
};

const isOk = checkProviderBitMapInfo();

try {
  if (isOk) {
    console.log("Bitmaps are equal!");
    process.exit(0);
  } else {
    console.error(
      "*********************************************\n\
* ERROR : Bitmaps are not equal             *\n\
*********************************************"
    );
    process.exit(1);
  }
} catch (err) {
  console.error(err);
  process.exit(1);
}
