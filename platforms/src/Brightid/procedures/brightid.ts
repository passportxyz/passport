/* eslint-disable @typescript-eslint/no-unsafe-call */
import { userVerificationStatus, userSponsorshipStatus, sponsor } from "brightid_sdk_v6";
import { BrightIdProcedureResponse, BrightIdSponsorshipResponse, SignedVerification } from "@gitcoin/passport-types";
import crypto from "crypto";

// --- app name for Bright Id App
const APP_NAME = "Gitcoin";

export const appUserIdForDid = (userDid: string): string => {
  // Hash the address so that the BrightID can't be traced back to the eth address
  return crypto
    .createHmac("sha256", process.env.BRIGHTID_PRIVATE_KEY)
    .update(userDid)
    .digest()
    .toString("base64url", 0, 32);
};

// TODO change return type
export const getBrightidInfoForUserDid = async (userDid: string): Promise<any> => {
  const appUserId = appUserIdForDid(userDid);
  let sponsoredResponse;
  try {
    sponsoredResponse = await userSponsorshipStatus(appUserId);
  } catch (e) {
    sponsoredResponse = { error: e };
  }

  try {
    const verifyContextIdResult = await userVerificationStatus(APP_NAME, appUserId);
    // Unique is true if the user obtained "Meets" verification by attending a connection party
    const isUnique = "unique" in verifyContextIdResult && verifyContextIdResult.unique === true;
    // Response reference https://dev.brightid.org/docs/node-api/3e6b0acc7fe6b-gets-a-signed-verification
    const isValid = "verification" in verifyContextIdResult && verifyContextIdResult.verification;

    return { appUserId, sponsoredResponse, valid: (isValid && isUnique) || false, result: verifyContextIdResult };
  } catch (err: unknown) {
    return { appUserId, sponsoredResponse, valid: false, error: err as string };
  }
};

export const triggerBrightidSponsorship = async (appUserId: string): Promise<BrightIdProcedureResponse> => {
  try {
    const sponsorResult: BrightIdSponsorshipResponse = (await sponsor(
      process.env.BRIGHTID_PRIVATE_KEY || "",
      APP_NAME,
      appUserId
    )) as BrightIdSponsorshipResponse;

    if ("error" in sponsorResult && sponsorResult.error) {
      return { valid: false, error: sponsorResult.errorMessage };
    }

    return { valid: true, result: sponsorResult };
  } catch (err: unknown) {
    return { valid: false, error: err as string };
  }
};
