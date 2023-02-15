/* eslint-disable @typescript-eslint/no-unsafe-call */
import { userVerificationStatus } from "brightid_sdk_v6";
// TODO change this import to v6 once v5 sponsorships are used up
import { sponsor } from "brightid_sdk";
import { BrightIdProcedureResponse, BrightIdSponsorshipResponse, SignedVerification } from "@gitcoin/passport-types";
import crypto from "crypto";

// --- app name for Bright Id App
const APP_NAME = "GitcoinPassport";
// TODO change this to match APP_NAME once v5 sponsorships are used up
const SPONSORSHIP_APP_NAME = "Gitcoin";

export const appUserIdForDid = (userDid: string): string => {
  // Hash the address so that the BrightID can't be traced back to the eth address
  return crypto
    .createHmac("sha256", process.env.BRIGHTID_PRIVATE_KEY)
    .update(userDid)
    .digest()
    .toString("base64url", 0, 32);
};

export const getBrightidInfoForUserDid = async (userDid: string): Promise<BrightIdProcedureResponse> => {
  const appUserId = appUserIdForDid(userDid);

  try {
    // This wild type conversion is necessary because the brightid_sdk_v6 package is wrong
    const verifyContextIdResult = (await userVerificationStatus(APP_NAME, appUserId)) as unknown as {
      data: SignedVerification[];
    };
    const verificationStatus = verifyContextIdResult.data[0];

    // Unique is true if the user obtained "Meets" verification by attending a connection party
    const valid = (verificationStatus.verification && verificationStatus.unique === true) || false;

    return { appUserId, valid, result: verificationStatus };
  } catch (err: unknown) {
    return { appUserId, valid: false, error: err as string };
  }
};

export const triggerBrightidSponsorship = async (appUserId: string): Promise<void> => {
  try {
    const sponsorResult: BrightIdSponsorshipResponse = (await sponsor(
      process.env.BRIGHTID_PRIVATE_KEY || "",
      SPONSORSHIP_APP_NAME,
      appUserId
    )) as BrightIdSponsorshipResponse;
  } catch (err: unknown) {
    // This can throw errors really easily, such as
    // when the user is first joining or if
    // the user has already been sponsored recently
    // If it works correctly, we don't get any valuable
    // info from the response, so we can just ignore it
  }
};
